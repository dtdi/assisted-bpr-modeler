import inherits from "inherits";

import pluralize from "pluralize";
import { getPotentialTriageActivities } from "../../../util/BsimUtil";

import Idea from "../Idea";
import Recommendation from "./Recommendation";

export default function TriageGuidedAdvice(
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

  this.score = { time: 0, cost: -1, quality: 0.5, flexibility: -1 };
}
inherits(TriageGuidedAdvice, Recommendation);

TriageGuidedAdvice.$inject = [
  "eventBus",
  "recommender",
  "bpmnjs",
  "elementRegistry",
  "selection",
  "redesignStack",
  "canvas",
  "modeling",
];

TriageGuidedAdvice.prototype.execute = function (dimension) {
  const self = this;
  // cancel any ongoing promises.
  if (this.score[dimension.key] < 0) {
    return;
  }

  // create sets of parallel-izable sequences.
  const idea = new Idea("DU-07", Recommendation.TYPE_GUIDED_ADVICE);
  idea.elements = getPotentialTriageActivities(
    self._elementRegistry,
    self._modeling
  );

  if (idea.elements.length == 0) {
    return;
  }

  idea.name = `Apply triage to up to ${pluralize(
    "activity",
    idea.elements.length,
    true
  )}`;
  idea.group = "furthertop";
  idea.description = `Select up to ${pluralize(
    "activity",
    idea.elements.length,
    true
  )} for division into alternative activities`;
  idea.category = "Business Process Operation";
  idea.bestPracticeClass = "Routing Rules";
  idea.contribution = this.score[dimension.key];
  idea.frameWorkAspect = "Operation view";
  idea.actions = [
    {
      iconProps: { iconName: "Settings" },
      onClick: self.onRemodel.bind(self, idea),
      ariaLabel: "Find candidates",
    },
    {
      iconProps: { iconName: "Blocked" },
      onClick: self.onDiscard.bind(self, idea),
      ariaLabel: "Discard",
      styles: { root: { color: "red" } },
    },
  ];

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
TriageGuidedAdvice.prototype.onRemodel = function (idea) {
  const context = { idea, elements: idea.elements };
  this._redesignStack.initialize("guidedAdvice.triage", context);
};
