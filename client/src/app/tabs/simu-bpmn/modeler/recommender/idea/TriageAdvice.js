import inherits from "inherits";

import { getTriageActivities } from "../../../util/BsimUtil";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import Idea from "../Idea";
import Recommendation from "./Recommendation";
import { GroupSpacer } from "office-ui-fabric-react";

export default function TriageAdvice(
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

  self.provides = new Idea("DU-07", Recommendation.TYPE_ADVICE);
  self.provides.name = "Triage";

  self.score = { time: 0, cost: -1, quality: 0.5, flexibility: -1 };
}

inherits(TriageAdvice, Recommendation);

TriageAdvice.$inject = [
  "eventBus",
  "recommender",
  "bpmnjs",
  "elementRegistry",
  "selection",
  "redesignStack",
  "canvas",
  "modeling",
];

TriageAdvice.prototype.execute = function (dimension) {
  const self = this;
  // cancel any ongoing promises.
  if (this.score[dimension.key] < 0) {
    return;
  }

  const process = self.getProcess();

  // create sets of parallel-izable sequences.
  const triageCandidates = getTriageActivities(
    process.flowElements,
    self._modeling
  );

  if (triageCandidates.length == 0) {
    return;
  }
  // evaluate the sequences
  const ideas = triageCandidates.map((group) => {
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
TriageAdvice.prototype.onRemodel = function (idea) {
  const context = {
    idea,
    element: idea.elements[0],
  };
  this._redesignStack.initialize("redesign.triage", context);
};

function _makeIdea(group, dimension, self) {
  const idea = new Idea("DU-07", Recommendation.TYPE_ADVICE);
  idea.hints = { related: group.elements || [] };
  idea.elements = [group.element];
  const names = idea.elements
    .map((s) => `"${getBusinessObject(s).name}"`)
    .join(", ");

  idea.name = `Apply triage to ${names}`;
  idea.group = "furthertop";
  idea.description = `Consider the division of ${names} into two or more alternative activities`;
  idea.category = "Business Process Operation";
  idea.bestPracticeClass = "Routing Rules";
  idea.frameWorkAspect = "Operation view";
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
