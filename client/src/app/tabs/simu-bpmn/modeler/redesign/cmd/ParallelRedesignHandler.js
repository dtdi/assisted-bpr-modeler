import inherits from "inherits";

import { compareAgainst, getNext, getPrev } from "../../../util/BsimUtil";

import {
  getResizedSourceAnchor,
  getResizedTargetAnchor,
} from "diagram-js/lib/features/modeling/cmd/helper/AnchorsHelper";

var round = Math.round;

import Handler from "./Handler";
import { merge } from "min-dash";
import MinModeler from "../../MinModeler";

export default function ParallelRedesignHandler(
  eventBus,
  moddle,
  commandStack,
  modeling,
  redesignStack,
  elementRegistry,
  elementFactory,
  injector,
  canvas,
  spaceTool,
  selection
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

  self._elementRegistry = elementRegistry;
  self._elementFactory = elementFactory;
  self._injector = injector;
  self._canvas = canvas;
  self._spaceTool = spaceTool;
  self._selection = selection;
}

ParallelRedesignHandler.$inject = [
  "eventBus",
  "moddle",
  "commandStack",
  "modeling",
  "redesignStack",
  "elementRegistry",
  "elementFactory",
  "injector",
  "canvas",
  "spaceTool",
  "selection",
];

inherits(ParallelRedesignHandler, Handler);

ParallelRedesignHandler.prototype.initialize = function (context) {
  const self = this;
  context._initUid = self._commandStack._uid;
  context.commandStack = self._commandStack;

  const elementRegistry = self._elementRegistry;
  const modeling = self._modeling;

  _redesign(false, context, elementRegistry, modeling, self._injector);

  // Store the last uid as a reference. In doubt, we need to re-evaluate
  context._lastUid = self._commandStack._uid;
};

/**
 * Returns a promise.
 * @param {} context
 */
ParallelRedesignHandler.prototype.evaluate = function (context) {
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

        _redesign(true, context, elementRegistry, modeling);

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
          simulation: {
            items: scenario.items,
            activities: scenario.activities,
          },
          baseline: base.baseline,
          values: items2,
          key: context.key,
          groups: scenario.groups,
        };
        context.performance = performance;

        res(context);
      });
  });
};

function execute(context, newContext) {}

ParallelRedesignHandler.prototype.commit = async function (
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
    msg = `Parallellized ${context.shapes.length} elements.`;
  } else msg = commitMessage || self.DEFAULT_COMMIT_MSG;
  context.commitMessage = msg;

  /**
   * Run a simulation experiment to validate changes before mvoing to the next part
   */
  //await self.evaluate(context);
  return context;
};

ParallelRedesignHandler.prototype.stash = function (context, newContext) {
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

function _addGW(oldShape, connection, modeling, isConvergingNode) {
  const width = oldShape.width,
    height = oldShape.height,
    x = oldShape.x,
    y = oldShape.y,
    centerX = round(x + width / 2),
    centerY = round(y + height / 2);

  // (1) add new shape at given position
  var position = {
    x: x + (isConvergingNode ? width + 50 : -50),
    y: centerY,
  };

  const gateway = modeling.createShape(
    { type: "bpmn:ParallelGateway" },
    position,
    oldShape.parent
  );

  var oldBounds = {
    x: oldShape.x,
    y: oldShape.y,
    width: oldShape.width,
    height: oldShape.height,
  };

  if (isConvergingNode) {
    modeling.reconnectStart(
      connection,
      gateway,
      getResizedSourceAnchor(connection, gateway, oldBounds)
    );
  } else {
    modeling.reconnectEnd(
      connection,
      gateway,
      getResizedTargetAnchor(connection, gateway, oldBounds)
    );
  }
  return gateway;
}

function _redesign(
  requiresSimulation,
  context,
  elementRegistry,
  modeling,
  injector
) {
  const elements = context.elements;
  let outgoing, incoming, first, last;
  const deletes = [];
  elements.forEach((elem) => {
    const next = getNext(elem, true);
    const prev = getPrev(elem, true);

    if (prev && !elements.includes(prev)) {
      incoming = elementRegistry.get(elem.incoming[0].id);
      first = elementRegistry.get(elem.id);
    }

    if (next) {
      if (!elements.includes(next)) {
        outgoing = elementRegistry.get(elem.outgoing[0].id);
        last = elementRegistry.get(elem.id);
      } else {
        deletes.push(elementRegistry.get(elem.outgoing[0].id));
      }
    }
  });

  modeling.removeElements(deletes);

  const elemShapes = elements.map((elem) => elementRegistry.get(elem.id));
  if (!requiresSimulation) {
    const alignElements = injector.get("alignElements");
    alignElements.trigger(elemShapes, "center");
    const selection = injector.get("selection");
    selection.select();
  }

  const startGW = _addGW(first, incoming, modeling);
  const endGW = _addGW(last, outgoing, modeling, true);

  elemShapes.forEach((shape) => {
    modeling.connect(startGW, shape);
    modeling.connect(shape, endGW);
  });
}
