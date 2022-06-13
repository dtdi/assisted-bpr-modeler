import { forEach } from "min-dash";

import ParallelRedesignHandler from "./cmd/ParallelRedesignHandler";
import SimpleRedesignHandler from "./cmd/SimpleRedesignHandler";
import TriageGuidedAdviceHandler from "./cmd/TriageGuidedAdviceHandler";
import TriageAdviceHandler from "./cmd/TriageAdviceHandler";
import BaseRedesignHandler from "./cmd/BaseRedesignHandler";
import AutomationGuidedAdviceHandler from "./cmd/AutomationGuidedAdviceHandler";
import ExtraResourcesRedesignHandler from "./cmd/ExtraResourcesRedesignHandler";
import AutomationAdviceHandler from "./cmd/AutomationAdviceHandler";

export default class Redesigner {
  constructor(eventBus, redesignStack) {
    this._eventBus = eventBus;
    this._redesignStack = redesignStack;

    const self = this;

    eventBus.on("diagram.init", function () {
      // register modeling handlers
      self.registerHandlers(redesignStack);
    });

    eventBus.on("bsim.import.completed", function () {
      // base evaluation

      self._redesignStack
        .evaluate("idea.base", {})
        .then((res) => console.log(res))
        .catch((err) => console.error(err));
    });
  }

  $inject = ["eventBus", "redesignStack"];

  getHandlers() {
    return {
      "idea.base": BaseRedesignHandler,
      "advice.parallel": ParallelRedesignHandler,
      "redesign.triage": TriageAdviceHandler,
      "idea.simple": SimpleRedesignHandler,
      "guidedAdvice.triage": TriageGuidedAdviceHandler,
      "guidedAdvice.automation": AutomationGuidedAdviceHandler,
      "advice.extraResources": ExtraResourcesRedesignHandler,
      "redesign.automation": AutomationAdviceHandler,
    };
  }

  registerHandlers(redesignStack) {
    forEach(this.getHandlers(), function (handler, id) {
      redesignStack.registerHandler(id, handler);
    });
  }
}
