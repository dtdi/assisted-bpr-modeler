import inherits from "inherits";

import pluralize from "pluralize";
import { getAutomationCandidates } from "../../../util/BsimUtil";

import Idea from "../Idea";
import Recommendation from "./Recommendation";

export default function AutomationGuidedAdvice(
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
  this._eventBus = eventBus;

  this.score = { time: 0.5, cost: -1, quality: 0.5, flexibility: -1 };
}
inherits(AutomationGuidedAdvice, Recommendation);

AutomationGuidedAdvice.$inject = [
  "eventBus",
  "recommender",
  "bpmnjs",
  "elementRegistry",

  "selection",
  "redesignStack",
  "canvas",
  "modeling",
];

AutomationGuidedAdvice.prototype.execute = function (dimension) {
  const self = this;
  // cancel any ongoing promises.
  if (this.score[dimension.key] < 0) {
    return;
  }

  const idea = new Idea("DU-25", Recommendation.TYPE_GUIDED_ADVICE);
  idea.elements = getAutomationCandidates(
    self._elementRegistry,
    self._modeling
  );

  if (idea.elements.length == 0) {
    return;
  }

  idea.name = `Automate ${pluralize("activity", idea.elements.length, true)}`;
  idea.group = "furthertop";
  idea.description = `Select up to ${pluralize(
    "activity",
    idea.elements.length,
    true
  )} for automation.`;
  idea.category = "Technology";
  idea.videoUrl = "https://www.youtube.com/JlTFobb0DOM";
  idea.bestPracticeClass = "Task Rules";
  idea.contribution = this.score[dimension.key];
  idea.frameWorkAspect = "Operation view";
  idea.actions = [
    {
      iconProps: { iconName: "Settings" },
      onClick: self.onRemodel.bind(self, idea),
      ariaLabel: "Show candidates",
    },
  ];
  if (idea.videoUrl) {
    idea.actions.push({
      iconProps: { iconName: "BoxPlaySolid" },
      onClick: this.onAction.bind(this, "play", idea.videoUrl),
      ariaLabel: "view video",
    });
  }

  this._recommender.pushIdeas(
    idea,
    [Recommendation.TYPE_HINT, Recommendation.TYPE_IDEA].map(
      (lvl) => `${idea.heuristicKey}.${lvl}`
    )
  );
};

/**
 *
 * @param {Idea} idea
 */
AutomationGuidedAdvice.prototype.onRemodel = function (idea) {
  const context = { idea, elements: idea.elements };
  this._redesignStack.initialize("guidedAdvice.automation", context);
};
