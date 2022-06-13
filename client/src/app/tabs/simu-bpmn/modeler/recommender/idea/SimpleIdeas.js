import inherits from "inherits";

import { forEach } from "min-dash";
import recData from "../model/recommendations.json";
import Idea from "../Idea";
import Recommendation from "./Recommendation";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { isDisqualified } from "../../../util/BsimUtil";

export default function SimpleIdeas(
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
}

inherits(SimpleIdeas, Recommendation);

SimpleIdeas.$inject = [
  "eventBus",
  "recommender",
  "bpmnjs",
  "elementRegistry",
  "selection",
  "redesignStack",
  "canvas",
  "modeling",
];

SimpleIdeas.prototype.onRedesign = function (context) {
  this._redesignStack.initialize("idea.simple", context);
};

SimpleIdeas.prototype.execute = function (dimension) {
  let entries = [];

  const self = this;
  const process = self.getProcess();

  forEach(recData, (r) => {
    const entry = new Idea(r.ID, 1);

    // (1) ignore the idea if the user deselected it
    if (isDisqualified(process, self._modeling, `is-${entry.heuristicKey}`))
      return;

    entry.group = "other";
    entry.elements = [process]; // todo: the whole process
    entry.name = r.Heuristic;
    entry.description = r.Description;
    entry.videoUrl = r["Video URL"];
    entry.category = r.Category;
    entry.bestPracticeClass = r["Best Practice Class"];
    entry.frameWorkAspect = r["Framework Aspect"];
    entry.contribution = _assessScore(
      {
        time: _mapScore(r.Time),
        cost: _mapScore(r.Cost),
        quality: _mapScore(r.Quality),
        flexibility: _mapScore(r.Flexibility),
      },
      dimension
    );

    if (entry.videoUrl) {
      entry.actions.push({
        iconProps: { iconName: "BoxPlaySolid" },
        onClick: this.onAction.bind(this, "play", entry.videoUrl),
        ariaLabel: "view video",
      });
    }

    entry.actions.push(
      {
        iconProps: { iconName: "Edit" },
        onClick: this.onAction.bind(this, "editMode", entry),
        ariaLabel: "Enter Edit Mode",
      },
      {
        iconProps: { iconName: "Blocked" },
        onClick: this.onDiscard.bind(self, entry),
        ariaLabel: "Discard",
        styles: { root: { color: "red" } },
      }
    );

    if (entry.heuristicKey === "DTDI-01") {
      entry.actions.push({
        iconProps: { iconName: "GiftboxOpen" },
        onClick: this.onAction.bind(this, "celebrate", entry),
        ariaLabel: "Celebrate",
      });
    }

    if (entry.contribution > 0) entries.push(entry);
  });

  this._recommender.pushIdeas(entries);
};

function _assessScore(score, focusDimension) {
  if (focusDimension && focusDimension.key) {
    return score[focusDimension.key];
  }
}

function _mapScore(score) {
  switch (score) {
    case ".":
      return 0;
    case "+":
      return 0.5;
    case "++":
      return 1;
    case "-":
      return -0.5;
    case "--":
      return -1;
  }
}
