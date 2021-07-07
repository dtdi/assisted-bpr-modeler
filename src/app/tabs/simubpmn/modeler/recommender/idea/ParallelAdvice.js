import inherits from "inherits";

import { getStraightSequences } from "../../../util/BsimUtil";
import Idea from "../Idea";
import pluralize from "pluralize";
import { flatten, forEach, some } from "min-dash";
import Recommendation from "./Recommendation";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

export default function ParallelAdvice(
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

  this.provides = new Idea("DU-10", Recommendation.TYPE_ADVICE);
  this.provides.name = "Parallelize sequential tasks";

  this.score = { time: 0.5, cost: -1, quality: 1, flexibility: -1 };
}

inherits(ParallelAdvice, Recommendation);

ParallelAdvice.$inject = [
  "eventBus",
  "recommender",
  "bpmnjs",
  "elementRegistry",
  "selection",
  "redesignStack",
  "canvas",
  "modeling",
];

ParallelAdvice.prototype.execute = function (dimension) {
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

ParallelAdvice.prototype.onDiscard = function (idea) {
  const self = this;
  const elems = idea.elements;

  const qualifier = `is-${idea.heuristicKey}`;

  idea.elements.forEach((element) => {
    const prop = self._modeling.getProperty(element, qualifier);

    const related = [
      ...new Set([
        ...(prop?.related || []),
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
ParallelAdvice.prototype.onRemodel = function (idea) {
  const self = this;
  const controller = new AbortController();
  const { signal } = controller;
  const context = {
    idea,
    elements: idea.elements,
    abortSignal: signal,
    performance: idea.performance,
  };
  self.onPreview(idea);
  this._redesignStack.initialize("advice.parallel", context);
};

ParallelAdvice.prototype.defer = function () {
  var res, rej;
  const self = this;
  const controller = new AbortController();
  const { signal } = controller;
  var promise = new Promise((resolve, reject) => {
    res = resolve;
    rej = reject;

    const process = self.getProcess();

    // (1) create sets of parallel-izable sequences.
    let sequenceElements = getStraightSequences(process);
    sequenceElements = self._getNonDependantElements(sequenceElements);
    // (2) check if some of these sequences disqualify based on their abpr:properties
    sequenceElements = sequenceElements.filter((sequence) => {
      if (sequence.length < 2) return false;
      const relations = flatten(
        sequence.map((element) => {
          const prop = self._modeling.getProperty(element, "is-DU-10");
          return prop?.related.map((r) => r.id) || [];
        })
      );
      return !some(sequence, (s) => {
        return relations.includes(s.id);
      });
    });

    if (sequenceElements.length === 0) {
      resolve([]);
    }

    // (3) evaluate the sequences
    Promise.all(
      sequenceElements.map((elements, i) => {
        const context = { elements: elements, abortSignal: signal, key: i };
        return self._redesignStack.evaluate("advice.parallel", context);
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
  const elements = context.elements;

  const names = elements.map((s) => `"${s.name}"`).join(", ");

  // @todo: replace with actual result

  const idea = new Idea("DU-10", Recommendation.TYPE_ADVICE);
  idea.performance = context.performance;
  const time = idea.performance.values[0].diffNice;

  idea.name = `Parallelise ${pluralize("activity", elements.length, true)}`;
  idea.description = `Putting ${names} parallel might improve throughput time by ${time}`;
  idea.category = "Business Process Behavior";
  idea.bestPracticeClass = "Routing Rules";
  idea.frameWorkAspect = "Behavioral view";

  idea.elements = elements;
  idea.actions = [
    {
      iconProps: { iconName: "SelectAll" },
      onClick: self.onPreview.bind(self, idea),
      ariaLabel: "Show items",
    },
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

// get non-dependent arrays of sequences that allow for parallelization.
// input are task sequences.
// output might by more arrays as defined in the input.
ParallelAdvice.prototype._getNonDependantElements = function (sequences) {
  const self = this;

  const outputSequences = [];
  sequences.forEach((sequence) => {
    // cheat
    if (sequence.length > 2) {
      //return [];
    }

    // (1) todo: bring sequence in right order based on sequence flows.
    const bOs = sequence.map(getBusinessObject);
    const inRequiredAt = [];
    const outDefinedAt = [];
    const filteredSequence = [];

    // (2) extract all data dependencies.
    bOs.map((elem, elementIndex) => {
      const out = self._modeling.getExtensionElementByName(
        elem,
        "camunda:InputOutput"
      );
      if (!out) return;
      const { outputParameters, inputParameters } = out;

      const input = inputParameters?.map((e) => e.get("name")) || [];
      const output = outputParameters?.map((e) => e.get("name")) || [];
      inRequiredAt.push(
        ...input.map((inn) => {
          return { idx: elementIndex, name: inn };
        })
      );

      outDefinedAt.push(
        ...output.map((out) => {
          return { idx: elementIndex, name: out };
        })
      );
    });

    const elemQualifies = Array(sequence.length).fill(true);

    let currentIdx = 0;
    inRequiredAt.forEach((element, i) => {
      const { name, idx: elementIndex } = element;

      // (3b) check for data dependencies within sequence.
      const isDependant = outDefinedAt.find((defindedOutput) => {
        return defindedOutput.name === name;
      });

      if (isDependant) {
        elemQualifies[elementIndex] = false;
      }
    });

    if (elemQualifies[currentIdx]) {
      // (3) push the element if there is
      //filteredSequence.push(sequence[currentIdx]);
    }
    // TODO: Parallel to sequential activities.
    //filteredSequence.push(...sequence);
    let start = 0;
    for (let l = 0; l < elemQualifies.length; l++) {
      if (!elemQualifies[l]) {
        let newSequence = sequence.slice(start, l);
        outputSequences.push(newSequence);
        start = l;
      } else {
        if (l == elemQualifies.length - 1) {
          let newSequence = sequence.slice(start, elemQualifies.length);
          outputSequences.push(newSequence);
        }
      }
    }
  });
  return outputSequences;
};
