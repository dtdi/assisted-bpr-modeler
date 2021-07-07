import inherits from "inherits";

import Handler from "./Handler";

import { compareAgainst } from "../../../util/BsimUtil";

import { createCanvasEvent as canvasEvent } from "../../features/modeling/util/MockEvents";

import {
  getResizedSourceAnchor,
  getResizedTargetAnchor,
} from "diagram-js/lib/features/modeling/cmd/helper/AnchorsHelper";

var round = Math.round;

import TriageAdviceWizard, { Footer } from "../ui/TriageAdviceWizard";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { isArray, merge } from "min-dash";
import pluralize from "pluralize";

export default function TriageAdviceHandler(
  eventBus,
  moddle,
  commandStack,
  modeling,
  redesignStack,
  elementRegistry,
  elementFactory,
  injector,
  canvas,
  copyPaste,
  spaceTool,
  dragging
) {
  const self = this;

  Handler.call(
    this,
    eventBus,
    moddle,
    commandStack,
    modeling,
    redesignStack,
    elementRegistry
  );

  self._elementFactory = elementFactory;
  self._injector = injector;
  self._canvas = canvas;
  self._copyPaste = copyPaste;
  self._spaceTool = spaceTool;
  self._dragging = dragging;
}

inherits(TriageAdviceHandler, Handler);

TriageAdviceHandler.$inject = [
  "eventBus",
  "moddle",
  "commandStack",
  "modeling",
  "redesignStack",
  "elementRegistry",
  "elementFactory",
  "injector",
  "canvas",
  "copyPaste",
  "spaceTool",
  "dragging",
];

TriageAdviceHandler.prototype.initialize = function (context) {
  const self = this;

  context._initUid = self._commandStack._uid;
  context.commandStack = self._commandStack;

  this._initialRedesign(context);

  context.wizard = {
    isVisible: true,
    component: TriageAdviceWizard,
    footer: Footer,
  };
};

TriageAdviceHandler.prototype.execute = function (context, newContext) {
  const self = this;
  const pasted = self._insertNew(context);
  context.elements.push(pasted);
};

TriageAdviceHandler.prototype.commit = async function (context, newContext) {
  merge(context, newContext);
  const self = this;

  const { commitMessage } = context;

  context.actions = self._commandStack._stack.filter(
    (stackItem, idx) =>
      stackItem.id >= context._initUid && idx < self._commandStack._stackIdx
  );

  self._modeling.updateLabel(
    context.startGw,
    self._modeling.getProp(context.element, "triageSplitCriteria")
  );

  context.elements.forEach((elem) => {
    self._modeling.setProp(
      getBusinessObject(elem),
      "is-DU-07",
      false,
      context.elements.map((e) => getBusinessObject(e))
    );
  });

  context.shapes = context.elements;

  let msg;
  if (!commitMessage || commitMessage === self.DEFAULT_COMMIT_MSG) {
    const word = pluralize("alternative", context.shapes.length - 1, true);
    msg = `Created ${word}.`;
  } else msg = commitMessage || self.DEFAULT_COMMIT_MSG;
  context.commitMessage = msg;

  //delete context.commandStack;

  /**
   * Run a simulation experiment to validate changes before mvoing to the next part
   */
  await self.evaluate(context);
  return context;
};

TriageAdviceHandler.prototype.stash = function (context, newContext) {
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

/**
 * Helper Function
 */
TriageAdviceHandler.prototype._addGW = function (element, connection, hints) {
  hints = hints || {};
  const self = this;
  const width = element.width,
    height = element.height,
    x = element.x,
    y = element.y,
    centerY = round(y + height / 2);

  const startSpaceX = x + (hints.isConverging ? width : -1);
  const stopSpaceX = startSpaceX + 50;

  // (0) make space left or right depending on
  self._spaceTool.activateMakeSpace(
    canvasEvent(self._canvas, self._eventBus, { x: startSpaceX, y: centerY })
  );
  self._dragging.move(
    canvasEvent(self._canvas, self._eventBus, { x: stopSpaceX, y: centerY })
  );
  self._dragging.end();
  self._dragging.cancel();

  // (1) add new shape at given position
  var position = {
    x: hints.isConverging ? stopSpaceX : startSpaceX,
    y: centerY,
  };

  const gateway = self._modeling.createShape(
    { type: "bpmn:ExclusiveGateway" },
    position,
    element.parent
  );

  if (!hints.isConverging)
    self._modeling.updateLabel(gateway, hints.label || "Diverging");

  var oldBounds = {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
  };

  if (hints.isConverging) {
    self._modeling.reconnectStart(
      connection,
      gateway,
      getResizedSourceAnchor(connection, gateway, oldBounds)
    );
  } else {
    self._modeling.reconnectEnd(
      connection,
      gateway,
      getResizedTargetAnchor(connection, gateway, oldBounds)
    );
  }
  return gateway;
};

TriageAdviceHandler.prototype._initialRedesign = function (context) {
  const self = this;
  const element = context.element;
  context.elements = [element];
  const bO = getBusinessObject(element);
  self._modeling.updateLabel(element, (bO.name || bO.id) + " (Original)");

  let outgoing, incoming;

  incoming = self._elementRegistry.get(element.incoming[0].id);
  outgoing = self._elementRegistry.get(element.outgoing[0].id);

  const startGW = this._addGW(element, incoming, {
    label: self._modeling.getProp(bO, "triageSplitCriteria"),
  });
  const endGW = this._addGW(element, outgoing, { isConverging: true });

  self._modeling.connect(startGW, element);
  self._modeling.connect(element, endGW);

  context.startGw = startGW;
  context.endGw = endGW;

  const pasted = self._insertNew(context);
  context.elements.push(pasted);
};

TriageAdviceHandler.prototype._insertNew = function (context) {
  const self = this;
  const copyShape = self._elementRegistry.get(context.element.id);

  self._copyPaste.copy(copyShape);

  const width = copyShape.width,
    height = copyShape.height,
    x = copyShape.x,
    y = copyShape.y,
    centerX = round(x + width / 2);

  const startSpaceY = y + height;
  const stopSpaceY = startSpaceY + height;

  // (0) make space left or right depending on
  self._spaceTool.activateMakeSpace(
    canvasEvent(self._canvas, self._eventBus, { x: centerX, y: startSpaceY })
  );
  self._dragging.move(
    canvasEvent(self._canvas, self._eventBus, { x: centerX, y: stopSpaceY })
  );
  self._dragging.end();
  self._dragging.cancel();

  // (1) add new shape at given position
  var position = {
    x: centerX,
    y: stopSpaceY,
  };

  const copyCtx = {
    element: copyShape.parent,
    point: position,
  };

  let pasted = self._copyPaste.paste(copyCtx);

  if (isArray(pasted) && pasted.length == 1) {
    pasted = pasted[0];
  }

  const bO = getBusinessObject(pasted);

  self._modeling.updateLabel(
    pasted,
    (bO.name || bO.id).replace("(Original)", "(Copy)")
  );

  const connection = self._modeling.connect(context.startGw, pasted);

  self._modeling.updateLabel(connection, "new path");
  self._modeling.connect(pasted, context.endGw);
  return pasted;
};
