import inherits from "inherits";

import TriageGuidedAdviceWizard, {
  Footer,
} from "../ui/TriageGuidedAdviceWizard";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import Handler from "./Handler";

export default function TriageGuidedAdviceHandler(
  eventBus,
  moddle,
  commandStack,
  modeling,
  redesignStack,
  elementRegistry
) {
  Handler.call(
    this,
    eventBus,
    moddle,
    commandStack,
    modeling,
    redesignStack,
    elementRegistry
  );
}

TriageGuidedAdviceHandler.$inject = [
  "eventBus",
  "moddle",
  "commandStack",
  "modeling",
  "redesignStack",
  "elementRegistry",
];

inherits(TriageGuidedAdviceHandler, Handler);

TriageGuidedAdviceHandler.prototype.initialize = function (context) {
  const self = this;

  context._initUid = self._commandStack._uid;
  context.commandStack = self._commandStack;

  context.commitMessage = self.DEFAULT_COMMIT_MSG;

  context.wizard = {
    isVisible: true,
    component: TriageGuidedAdviceWizard,
    footer: Footer,
  };
};

TriageGuidedAdviceHandler.prototype.commit = function (context, newContext) {
  const self = this;

  const { commitMessage } = newContext;

  context.actions = self._commandStack._stack.filter(
    (stackItem, idx) =>
      stackItem.id >= context._initUid && idx < self._commandStack._stackIdx
  );

  context.shapes = context.elements.filter((elem) => {
    return self._modeling.getProp(getBusinessObject(elem), "isTriageCandidate");
  });

  let msg;
  if (!commitMessage || commitMessage === self.DEFAULT_COMMIT_MSG)
    msg = `Selected ${context.shapes.length} elements as potential candidates for triage.`;
  else msg = commitMessage || self.DEFAULT_COMMIT_MSG;
  context.commitMessage = msg;

  delete context.commandStack;
};

TriageGuidedAdviceHandler.prototype.stash = function (context, newContext) {
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
