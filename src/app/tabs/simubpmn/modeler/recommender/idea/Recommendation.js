import { elementToString } from "bpmn-js/lib/import/Util";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { getBBox as getBoundingBox } from "diagram-js/lib/util/Elements";
import ConfettiGenerator from "confetti-js";

export default function Recommendation(
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
  self._eventBus = eventBus;
  self._canvas = canvas;
  self._recommender = recommender;
  self._selection = selection;
  self._bpmnjs = bpmnjs;
  self._elementRegistry = elementRegistry;
  self._redesignStack = redesignStack;
  self._modeling = modeling;
}

Recommendation.TYPE_IDEA = 1;
Recommendation.TYPE_HINT = 2;
Recommendation.TYPE_GUIDED_ADVICE = 3;
Recommendation.TYPE_ADVICE = 4;

Recommendation.$inject = [
  "eventBus",
  "recommender",
  "bpmnjs",
  "elementRegistry",
  "selection",
  "redesignStack",
  "canvas",
  "modeling",
];

Recommendation.prototype.getProcess = function (diagram) {
  const self = this;
  const definitions = self._bpmnjs._definitions;

  // make sure we walk the correct bpmnElement

  const diagrams = definitions.diagrams;

  if (diagram && diagrams.indexOf(diagram) === -1) {
    throw new Error("diagram not part of bpmn:Definitions");
  }

  if (!diagram && diagrams && diagrams.length) {
    diagram = diagrams[0];
  }

  // no diagram -> nothing to import
  if (!diagram) {
    throw new Error("no diagram to display");
  }

  var plane = diagram.plane;

  if (!plane) {
    throw new Error(`no plane for ${elementToString(diagram)}`);
  }

  var rootElement = plane.bpmnElement;

  if (is(rootElement, "bpmn:Process")) {
    return rootElement;
  } else if (is(rootElement, "bpmn:Collaboration")) {
    return handleCollaboration(rootElement);
  } else {
    throw new Error(
      `unsupported bpmnElement for ${elementToString(plane)}: ${elementToString(
        rootElement
      )}`
    );
  }
};

function handleParticipant(participant) {
  var process = participant.processRef;
  if (process) {
    return process;
  }
}

function handleCollaboration(collaboration) {
  return collaboration.participants
    .map(handleParticipant)
    .find((p) => is(p, "bpmn:Process"));
}

Recommendation.prototype.onDiscard = function (idea) {
  const self = this;

  idea.elements.forEach((element) => {
    self._modeling.setProp(element, `is-${idea.heuristicKey}`, false);
  });

  self._recommender.removeIdeas(idea);
};

Recommendation.prototype.onAction = function (action, idea) {
  const self = this;
  if (action === "play") {
    window.open(idea, "_blank");
    return;
  }
  if (action === "editMode") {
    const context = {
      idea: idea,
    };
    self.onRedesign(context);
  }
  if (action === "celebrate") {
    const config = {
      target: "confetti-holder",
      max: "80",
      size: "1",
      animate: true,
      props: ["circle", "square", "triangle", "line"],
      colors: [
        [165, 104, 246],
        [230, 61, 135],
        [0, 199, 228],
        [253, 214, 126],
      ],
      clock: "25",
      rotate: true,
      start_from_edge: false,
      respawn: true,
    };
    const generator = new ConfettiGenerator(config);
    const party = setTimeout(() => {
      generator.clear();
    }, 5000);
    generator.render();
  }
};

Recommendation.prototype.onPreview = function (idea) {
  const shapes = idea.elements
    .map(getBusinessObject)
    .map((e) => this._elementRegistry.get(e.id));
  var viewbox = this._canvas.viewbox();
  var box = getBoundingBox(shapes);

  var newViewbox = {
    x: box.x + box.width / 2 - viewbox.outer.width / 2,
    y: box.y + box.height / 2 - viewbox.outer.height / 2,
    width: viewbox.outer.width,
    height: viewbox.outer.height,
  };
  this._canvas.viewbox(newViewbox);

  this._canvas.zoom(viewbox.scale);

  this._selection.select(shapes);
};
