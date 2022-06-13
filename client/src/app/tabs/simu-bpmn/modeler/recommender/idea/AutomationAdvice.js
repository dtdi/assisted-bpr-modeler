import inherits from "inherits";

import { getAutomationActivities } from "../../../util/BsimUtil";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import Idea from "../Idea";
import Recommendation from "./Recommendation";

export default function AutomationAdvice(
  eventBus,
  recommender,
  bpmnjs,
  elementRegistry,
  selection,
  redesignStack,
  canvas,
  modeling
) {
  Recommendation.call(
    this,
    eventBus,
    recommender,
    bpmnjs,
    elementRegistry,
    selection,
    redesignStack,
    canvas,
    modeling
  );
  const self = this;

  self.provides = new Idea("DU-25", Recommendation.TYPE_ADVICE);
  self.provides.name = "Automation";

  self.score = { time: 0, cost: -1, quality: 0.5, flexibility: -1 };
}

inherits(AutomationAdvice, Recommendation);

AutomationAdvice.$inject = [
  "eventBus",
  "recommender",
  "bpmnjs",
  "elementRegistry",
  "selection",
  "redesignStack",
  "canvas",
  "modeling",
];

AutomationAdvice.prototype.execute = function (dimension) {
  const self = this;
  // cancel any ongoing promises.
  if (this.score[dimension.key] < 0) {
    return;
  }

  const process = self.getProcess();

  // create sets of parallel-izable sequences.
  const automationCandidates = getAutomationActivities(
    process.flowElements,
    self._modeling
  );

  if (automationCandidates.length == 0) {
    return;
  }
  // evaluate the sequences
  const ideas = automationCandidates.map((group) => {
    group.element = this._elementRegistry.get(group.element.id);
    return _makeIdea(group, dimension, self);
  });

  this._recommender.pushIdeas(
    ideas,
    [
      Recommendation.TYPE_HINT,
      Recommendation.TYPE_IDEA,
      Recommendation.TYPE_GUIDED_ADVICE,
    ].map((lvl) => `${this.provides.heuristicKey}.${lvl}`)
  );
};

/**
 *
 * @param {Idea} idea
 */
AutomationAdvice.prototype.onRemodel = function (idea) {
  const context = {
    idea,
    element: idea.elements[0],
  };
  this._redesignStack.initialize("redesign.automation", context);
};

function _makeIdea(group, dimension, self) {
  const idea = new Idea("DU-25", Recommendation.TYPE_ADVICE);
  idea.hints = { related: group.elements || [] };
  idea.elements = [group.element];
  const names = idea.elements
    .map((s) => `"${getBusinessObject(s).name}"`)
    .join(", ");

  idea.name = `Apply Automation to ${names}`;
  idea.group = "furthertop";
  idea.description = `Consider the task automation of ${names} to realize performance gains`;
  idea.category = "Technology";
  idea.bestPracticeClass = "Task Rules";
  idea.frameWorkAspect = "Task Rules";
  idea.contribution = self.score[dimension.key];
  idea.actions = [
    {
      iconProps: { iconName: "SelectAll" },
      onClick: self.onPreview.bind(self, idea),
      ariaLabel: "Show items",
    },
    {
      iconProps: { iconName: "Settings" },
      onClick: self.onRemodel.bind(self, idea),
      ariaLabel: "Remodel",
    },
    {
      iconProps: { iconName: "Blocked" },
      onClick: self.onDiscard.bind(self, idea),
      ariaLabel: "Discard",
      styles: { root: { color: "red" } },
    },
  ];
  return idea;
}
