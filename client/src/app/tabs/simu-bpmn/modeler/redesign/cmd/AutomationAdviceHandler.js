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

export default function AutomationAdviceHandler(
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

inherits(AutomationAdviceHandler, Handler);

AutomationAdviceHandler.$inject = [
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

AutomationAdviceHandler.prototype.commit = async function (
  context,
  newContext
) {
  merge(context, newContext);

  const self = this;

  context.actions = self._commandStack._stack.filter(
    (stackItem, idx) =>
      stackItem.id >= context._initUid && idx < self._commandStack._stackIdx
  );

  context.shapes = context.shapes || [];

  self._modeling.setProp(getBusinessObject(context.element), "is-DU-25", true);
  self._modeling.setProp(
    getBusinessObject(context.element),
    "may-DU-25",
    false
  );

  context.shapes = context.elements;

  let msg;
  if (
    !context.commitMessage ||
    context.commitMessage === self.DEFAULT_COMMIT_MSG
  ) {
    const word = pluralize("automate", 1, true);
    msg = `Created ${word}.`;
  } else msg = context.commitMessage || self.DEFAULT_COMMIT_MSG;
  context.commitMessage = msg;

  //delete context.commandStack;

  /**
   * Run a simulation experiment to validate changes before mvoing to the next part
   */
  await self.evaluate(context);

  return context;
};

AutomationAdviceHandler.prototype.stash = function (context, newContext) {
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
