import ReactDOM from "react-dom";
import React from "react";
import Panel from "../editor-pane/Panel";
import Idea from "../../recommender/Idea";
import { ModdleContext } from "../editor-pane/elements/context";
import { isAny } from "../modeling/util/ModelingUtil";
import { domify } from "min-dom";
import { MessageBar } from "@fluentui/react";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { forEach } from "min-dash";

const LOW_PRIORITY = 500;

export default class RedesignPanel {
  constructor(
    config,
    eventBus,
    modeling,
    commandStack,
    redesignStack,
    recommender,
    elementRegistry,
    moddle,
    overlays
  ) {
    this._eventBus = eventBus;
    this._modeling = modeling;
    this._commandStack = commandStack;
    this._redesignStack = redesignStack;
    this._recommender = recommender;
    this._elementRegistry = elementRegistry;
    this._moddle = moddle;
    this._overlays = overlays;

    this.ideas = [];

    this._init(config);
  }

  $inject = [
    "config.redesignPanel",
    "eventBus",
    "modeling",
    "recommender",
    "commandStack",
    "redesignStack",
    "elementRegistry",
    "moddle",
    "overlays",
  ];

  _init(config) {
    var eventBus = this._eventBus;

    var self = this;
    window.commandstack = self._commandStack;
    window.redesignStack = self._redesignStack;

    this._panelRef = null;

    if (config && config.parent) {
      console.log("init via config");

      this.attachTo(config.parent);
    }

    this._eventBus.on("redesignPanel.attach", (e) => {
      this._updateState({
        definitions: self._definitions,
        ideas: self._ideas,
        redesignStack: self._redesignStack,
      });
      this.pushSimuElements();
    });

    this._eventBus.on("import.parse.complete", (e) => {
      if (!e.definitions) return;

      self._definitions = e.definitions;

      self._updateState({
        definitions: self._definitions,
      });
    });

    this._eventBus.on(
      ["import.done", "elements.changed"],
      LOW_PRIORITY,
      (e) => {
        this.pushSimuElements();
      }
    );

    eventBus.on("diagram.destroy", function () {
      self.detach();
    });

    // add / update tab-bar scrolling
    eventBus.on("bsim.toggle-config-modal", function (event) {
      self._updateState({
        isConfigModalVisible: !self._panelRef.current.state
          .isConfigModalVisible,
      });
    });

    // add / update tab-bar scrolling
    eventBus.on("redesign.dimension.changed", function (event) {
      self._updateState({
        focusDimension: event.dimension,
      });
    });

    eventBus.on("redesign.recs.changed", function (event) {
      self._ideas = event.ideas;
      self._updateState({
        ideas: event.ideas,
      });
    });

    eventBus.on(
      [
        "redesignStack.evaluation-started",
        "redesignStack.evaluated",
        "redesignStack.evaluation-failed",
      ],
      (ev) => {
        const { type, context: cntx, redesign } = ev;
        let newState = {};
        if (type === "redesignStack.evaluation-started") {
          newState = {
            isBusy: true,
          };
        } else if (type === "redesignStack.evaluated") {
          newState = {
            isBusy: false,
          };
        } else if (type === "redesignStack.evaluation-failed") {
          newState = {
            isBusy: false,
          };
        }
        self._updateState(newState);
      }
    );

    eventBus.on(
      [
        "redesignStack.committed",
        "redesignStack.initialized",
        "redesignStack.stashed",
        "redesignStack.changed",
        "redesignStack.finalized",
        "redesignStack.evaluated",
        "redesignStack.idea.base.evaluated",
      ],
      (ev) => {
        const { type, context: cntx, redesign } = ev;
        const context = cntx || {};
        console.log(ev);
        let newState = {};
        if (type === "redesignStack.initialized") {
          newState = {
            tab: "editmode",
            context: context,
          };
        } else if (type === "redesignStack.stashed") {
          newState = {
            tab: "ideas",
            context: null,
            stackIdxInit: null,
          };
        } else if (type === "redesignStack.committed") {
          newState = {
            tab: "simulation",
            simuPerf: context.performance,
            redesignStack: self._redesignStack,
          };
        } else if (type === "redesignStack.changed") {
          newState = {
            redesignStack: this._redesignStack,
          };
        } else if (type === "redesignStack.reverted") {
          newState = {
            context: context,
            stackIdxInit: self._commandStack._stackIdx,
          };
        } else if (type === "redesignStack.finalized") {
          newState = {
            context: null,
            stackIdxInit: null,
            tab: "ideas",
          };
        } else if (type === "redesignStack.idea.base.evaluated") {
          forEach(context.baseline.activities, (e, k) => {
            getBusinessObject(this._elementRegistry.get(k)).bsim.quant =
              e[4].valueNice;
          });

          newState = {
            simuPerf: context,
          };
        }

        self._updateState(newState);
      }
    );

    eventBus.on("commandStack.changed", () => {
      self._updateState({
        commandStack: self._commandStack,
      });
    });

    /**
     * Select the root element once it is added to the canvas
     */
    eventBus.on("root.added", function (e) {
      var element = e.element;

      if (isImplicitRoot(element)) {
        return;
      }

      self.update(element);
    });
  }

  onAction = (action, context) => {
    const self = this;

    console.log("onAction", action, context);

    if (action === "start-empty") {
      if (!context) {
        const idea = new Idea("DT-0", 0);
        idea.name = "Manual Redesign";
        idea.bestPracticeClass = "other";
        context = {
          idea: idea,
        };
      }
      self._redesignStack.initialize("idea.simple", context);
      return;
    } else if (action === "change-objective") {
      self._recommender.setFocusDimension(context);
    } else if (action === "base-simulation") {
      context = context || {};
      context.restart = true;
      self._redesignStack.evaluate("idea.base", context);
    } else if (action === "stash") {
      self._redesignStack.stash(context);
    } else if (action === "next") {
      self._redesignStack.next(context);
    } else if (action === "commit") {
      context = context || {};

      self._redesignStack.commit(context);
    } else if (action === "revert") {
      self._redesignStack.revert(context);
    } else if (action === "finalize") {
      self._redesignStack.finalize(context);
    } else if (action === "commit-finalize") {
      self._redesignStack.commit(context);
      self._redesignStack.finalize(context);
    } else if (action === "refresh-recommendations") {
      self._recommender.refresh();
    }
  };

  onModdleChange = (element, moddleElement, properties) => {
    console.log("moddle change", element, moddleElement, properties);
    if (!moddleElement && !properties) {
      // fallback solution
      element(this._definitions);
    } else {
      // the new, commandstack-save api
      this._modeling.updateModdleProperties(element, moddleElement, properties);
    }

    this.pushSimuElements();
  };

  pushSimuElements() {
    const simuElements = this._elementRegistry
      .filter(
        (shape) =>
          shape.businessObject &&
          shape.businessObject.bsim &&
          shape.type !== "label" &&
          isAny(shape.businessObject.bsim, [
            "bsim:task",
            "bsim:exclusiveGateway",
            "bsim:startEvent",
            "bsim:boundaryEvent",
            "bsim:dataObject",
            "bsim:catchEvent",
            "bsim:dynamicResource",
          ])
      )
      .map((shape) => {
        var $html = this._findOrCreateOverlay(shape);
        return { html: $html, elem: getBusinessObject(shape).bsim };
      });

    this._updateState({
      simuElements: simuElements,
    });
  }

  _findOrCreateOverlay(shape) {
    const found = this._overlays.get({ element: shape, type: "bsim" });
    if (found.length === 0) {
      var $html = domify('<div class="bjsl-overlay"></div>');
      this._overlays.add(shape, "bsim", {
        position: { right: 10, top: -7 },
        html: $html,
        scale: { min: 0.9 },
      });
      return $html;
    } else {
      return found[0].html;
    }
  }

  _updateState(newState) {
    if (this._panelRef.current) {
      this._panelRef.current.setState(newState);
    }
  }

  update(element) {
    // (1) Fall back to root element
    if (!element) {
      element = this._canvas.getRootElement();
    }

    this._updateState({
      ideas: [],
    });

    this._emit("changed");
  }

  _create(element) {
    if (!element) {
      return null;
    }

    var containerNode = this._panelRef.current;
    if (!containerNode) return;

    return {
      element: element,
      node: containerNode,
    };
  }

  _emit(event) {
    this._eventBus.fire("redesignPanel." + event, {
      panel: this,
    });
  }

  onActivate = (ev) => {
    //console.log(ev);
  };

  attachTo(parentNode, simuRefNode) {
    if (!parentNode) {
      throw new Error("parentNode required");
    }
    this.detach(parentNode);
    this._panelRef = React.createRef();
    ReactDOM.render(
      <ModdleContext.Provider value={this._moddle}>
        <Panel
          ref={this._panelRef}
          onAction={this.onAction}
          onModdleChange={this.onModdleChange}
          modeling={this._modeling}
          onActivate={this.onActivate}
          simuRef={simuRefNode}
        />
      </ModdleContext.Provider>,
      parentNode
    );
    this._emit("attach");
  }

  detach(parentNode) {
    var container = this._panelRef;
    if (!container) {
      return;
    }
    if (!parentNode) {
      return;
    }
    console.log("detach");
    ReactDOM.unmountComponentAtNode(parentNode);
    this._overlays.remove({ type: "bsim" });

    this._emit("detach");
  }
}

function isImplicitRoot(element) {
  return element.id === "__implicitroot";
}
