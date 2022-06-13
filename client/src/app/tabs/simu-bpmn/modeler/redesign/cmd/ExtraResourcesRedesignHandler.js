import inherits from "inherits";

import Handler from "./Handler";
import { isArray, merge } from "min-dash";
import { compareAgainst } from "../../../util/BsimUtil";
import MinModeler from "../../MinModeler";

export default function ExtraResourcesRedesignHandler(
  eventBus,
  moddle,
  commandStack,
  modeling,
  redesignStack,
  elementRegistry
) {
  const self = this;
  Handler.call(
    self,
    eventBus,
    moddle,
    commandStack,
    modeling,
    redesignStack,
    elementRegistry
  );
}

ExtraResourcesRedesignHandler.$inject = [
  "eventBus",
  "moddle",
  "commandStack",
  "modeling",
  "redesignStack",
  "elementRegistry",
];

inherits(ExtraResourcesRedesignHandler, Handler);

ExtraResourcesRedesignHandler.prototype.initialize = function (context) {
  const self = this;
  context._initUid = self._commandStack._uid;
  context.commandStack = self._commandStack;

  const elementRegistry = self._elementRegistry;
  const modeling = self._modeling;

  _redesign(false, context, self._definitions, elementRegistry, modeling);

  // Store the last uid as a reference. In doubt, we need to re-evaluate
  context._lastUid = self._commandStack._uid;
};

/**
 * Returns a promise.
 * @param {} context
 */
ExtraResourcesRedesignHandler.prototype.evaluate = function (context) {
  const self = this;

  const m = new MinModeler();

  if (!self._definitions) {
    throw new Error("definitions is not defined");
  }

  return new Promise((res, rej) => {
    self._moddle
      // 1) serialize current model
      .toXML(self._definitions, {
        format: true,
      })
      // 2) import to temporary modeler
      .then((serialized) => {
        return m.importXML(serialized.xml);
      })
      // 3) redesign in the temporary modeler and serialize for simulation
      .then((result) => {
        delete m._definitions.resources;
        delete m._definitions.processes;

        const elementRegistry = m.get("elementRegistry");
        const modeling = m.get("modeling");

        _redesign(true, context, m._definitions, elementRegistry, modeling);

        return m.saveXML({ format: true });
      })
      // 4) simulate the redesign as well as the base simulation
      .then((serialized) => {
        return Promise.all([
          self._evaluate(
            serialized.xml,
            "simulation",
            self._moddle,
            context.abortSignal
          ),
          self._getBaseSimulation({ signal: context.abortSignal }),
        ]);
      })
      // 5) build comparison between scenario and baseline and resolve the promise
      .then((results) => {
        const scenario = results[0],
          base = results[1];
        const items2 = compareAgainst(base.values, scenario.items);
        const performance = {
          simulation: { items: scenario.items },
          baseline: { items: base.values },
          values: items2,
          key: context.key,
          groups: scenario.groups,
        };

        context.performance = performance;

        res(context);
      });
  });
};

ExtraResourcesRedesignHandler.prototype.commit = function (
  context,
  newContext
) {
  merge(context, newContext);
  const self = this;

  const { commitMessage } = context;

  context.actions = self._commandStack._stack.filter(
    (stackItem, idx) =>
      stackItem.id >= context._initUid && idx < self._commandStack._stackIdx
  );

  context.shapes = context.elements || [];

  let msg;
  if (!commitMessage || commitMessage === self.DEFAULT_COMMIT_MSG) {
    msg = context.idea.description;
  } else msg = commitMessage || self.DEFAULT_COMMIT_MSG;
  context.commitMessage = msg;

  delete context.commandStack;
};

ExtraResourcesRedesignHandler.prototype.stash = function (context, newContext) {
  const self = this;
  let undoAction = self._commandStack._getUndoAction();
  while (!!undoAction && undoAction.id >= context._initUid) {
    self._commandStack.undo();
    undoAction = self._commandStack._getUndoAction();
  }

  this._eventBus.fire("redesign.editMode.stashed", {
    data: context,
  });
};

// add extra resourceData to the simulation configuration
function _redesign(
  forSimulation,
  context,
  definitions,
  elementRegistry,
  modeling
) {
  let resource = context.elements;

  const m_resourceData =
    definitions.get("bsim:resourceData") &&
    definitions.get("bsim:resourceData").get("bsim:dynamicResource");

  const m_resource = m_resourceData.find((dynamicResource) => {
    return dynamicResource.id === resource.id;
  });

  modeling.updateModdleProperties(m_resource, m_resource, {
    defaultQuantity: context.newQuantity,
  });
}
