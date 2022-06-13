import inherits from "inherits";

import {
  getChangeResources,
  getStraightSequences,
} from "../../../util/BsimUtil";
import Idea from "../Idea";
import pluralize from "pluralize";
import Recommendation from "./Recommendation";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";

export default function ExtraResourcesAdvice(
  eventBus,
  recommender,
  bpmnjs,
  elementRegistry,
  selection,
  redesignStack,
  canvas,
  modeling
) {
  const self = this;
  Recommendation.call(
    self,
    eventBus,
    recommender,
    bpmnjs,
    elementRegistry,
    selection,
    redesignStack,
    canvas,
    modeling
  );

  self.provides = new Idea("DU-10", Recommendation.TYPE_ADVICE);
  self.provides.name = "Extra resources";

  self.score = { time: 0.5, cost: -1, quality: 0, flexibility: 0.5 };
}

inherits(ExtraResourcesAdvice, Recommendation);

ExtraResourcesAdvice.$inject = [
  "eventBus",
  "recommender",
  "bpmnjs",
  "elementRegistry",
  "selection",
  "redesignStack",
  "canvas",
  "modeling",
];

ExtraResourcesAdvice.prototype.execute = function (dimension) {
  // cancel any ongoing promises.
  if (this.currentRun) {
    this.currentRun.abort();
  }

  if (this.score[dimension.key] < 0) {
    this._recommender.pushIdeas([], [this.provides]);
    return;
  }

  this.currentRun = this.defer();

  this._recommender.pushIdeas([this.provides]);

  this.currentRun
    .then((res) => {
      if (res.length === 0) {
        this._recommender.removeIdeas([this.provides]);
      } else {
        this._recommender.pushIdeas(
          res,
          [
            Recommendation.TYPE_HINT,
            Recommendation.TYPE_IDEA,
            Recommendation.TYPE_GUIDED_ADVICE,
          ].map((lvl) => `${this.provides.heuristicKey}.${lvl}`)
        );
      }
    })
    .catch((err) => {
      console.error(err);
      this._recommender.pushIdeas([], []);
    });
};

ExtraResourcesAdvice.prototype.onDiscard = function (idea) {
  const self = this;
  const elems = idea.elements;

  const qualifier = `is-${idea.heuristicKey}`;

  idea.elements.forEach((element) => {
    const prop = self._modeling.getProperty(element, qualifier);

    const related = [
      ...new Set([
        ...((prop && prop.related) || []),
        ...elems.filter((e) => e.id !== element.id),
      ]),
    ];
    self._modeling.setProp(element, qualifier, false, related);
  });

  self._recommender.removeIdeas(idea);
};

/**
 *
 * @param {Idea} idea
 */
ExtraResourcesAdvice.prototype.onRemodel = function (idea) {
  const self = this;
  const controller = new AbortController();
  const { signal } = controller;
  const context = {
    idea,
    elements: idea.elements[0],
    newQuantity: idea.newQuantity,
    abortSignal: signal,
    performance: idea.performance,
  };
  this._redesignStack.initialize("advice.extraResources", context);
};

ExtraResourcesAdvice.prototype.defer = function () {
  var res, rej;
  const self = this;
  const controller = new AbortController();
  const { signal } = controller;
  var promise = new Promise((resolve, reject) => {
    res = resolve;
    rej = reject;

    // (1) find all resources.
    const definitions = self._bpmnjs._definitions;
    if (!is(definitions, "bpmn:Definitions")) resolve([]);

    let resourceData =
      definitions.get("bsim:resourceData") &&
      definitions.get("bsim:resourceData").get("bsim:dynamicResource");
    // (2) check if some of these sequences disqualify based on their abpr:properties
    if (!resourceData || resourceData.length === 0) {
      resolve([]);
    }
    resourceData = getChangeResources(resourceData, self._modeling);

    // (3) get current performance
    self._redesignStack.evaluate("idea.base", {}).then((perf) => {});

    // (4) evaluate the sequences
    Promise.all(
      resourceData.map((dynamicResource, i) => {
        const context = {
          elements: dynamicResource,
          newQuantity: Math.ceil((dynamicResource.defaultQuantity || 1) * 1.3),
          abortSignal: signal,
          key: i,
        };
        return self._redesignStack.evaluate("advice.extraResources", context);
      })
    )
      .then((results) => {
        const hints = results.map((context, i) => {
          const idea = _makeIdea(context, self);
          idea.contribution = idea.performance.values[0].diff;
          return idea;
        });
        resolve(hints);
      })
      .catch((err) => console.error(err));
  });

  promise.abort = () => {
    controller.abort();
    rej();
  };
  promise.resolve = res;
  promise.reject = rej;

  return promise;
};

function _makeIdea(context, self) {
  const element = context.elements;

  const name = element.name || element.id;

  const idea = new Idea("DU-20", Recommendation.TYPE_ADVICE);
  idea.performance = context.performance;
  idea.newQuantity = context.newQuantity;
  const time = idea.performance.values[2].diffNice;

  idea.name = `Add an extra '${name}' to improve flow time`;
  idea.description = `Increasing '${name}' by 30% (to ${idea.newQuantity}) might improve flow time by ${time}`;
  idea.category = "Organization";
  idea.bestPracticeClass = "Resource Rules";
  idea.frameWorkAspect = "Org.-population";

  idea.elements = [element];
  idea.actions = [
    {
      iconProps: { iconName: "Robot" },
      primary: true,
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

ExtraResourcesAdvice.prototype._getWaitingTasks = function (sequences) {};
