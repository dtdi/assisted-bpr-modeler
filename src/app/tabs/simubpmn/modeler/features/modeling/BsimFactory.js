import { isAny } from "./util/ModelingUtil";

import { is } from "bpmn-js/lib/util/ModelUtil";
import { ensureModdleProperty } from "../../../util/BsimUtil";

export default class BsimFactory {
  constructor(moddle) {
    this._model = moddle;
  }
  $inject = ["moddle"];

  _needsId = function (element) {
    return isAny(element, [
      "bsim:dynamicResource",
      "bsim:instance",
      "bsim:timetable",
    ]);
  };

  _ensureId = function (element) {
    // generate semantic ids for elements
    // bpmn:SequenceFlow -> SequenceFlow_ID
    var prefix = (element.$type || "").replace(/^[^:]*:/g, "");
    if (is(element, "bsim:dynamicResource")) {
      prefix = "Resource";
    }

    prefix += "_";

    if (!element.id && this._needsId(element)) {
      if (!is(element, "bsim:instance"))
        element.id = this._model.ids.nextPrefixed(prefix, element);
      else element.name = this._model.ids.nextPrefixed(prefix, element);
    }
  };

  create = function (type, attrs) {
    var element = this._model.create(type, attrs || {});

    this._ensureId(element);

    if (is(element, "bsim:task")) {
      ensureModdleProperty(element, "bsim:duration", this._model);
      ensureModdleProperty(element, "bsim:resources", this._model);
      ensureModdleProperty(element, "bsim:assignmentDefinition", this._model);
    } else if (is(element, "bsim:startEvent")) {
      ensureModdleProperty(element, "bsim:arrivalRate", this._model);
    } else if (is(element, "bsim:boundaryEvent")) {
      ensureModdleProperty(element, "bsim:eventProbability", this._model);
      ensureModdleProperty(element, "bsim:arrivalRate", this._model);
    } else if (is(element, "bsim:catchEvent")) {
      ensureModdleProperty(element, "bsim:arrivalRate", this._model);
    }

    return element;
  };
}
