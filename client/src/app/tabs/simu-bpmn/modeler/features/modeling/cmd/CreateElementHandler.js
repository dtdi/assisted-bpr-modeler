import { is } from "bpmn-js/lib/util/ModelUtil";
import Refs from "object-refs";
import { ensureModdleProperty } from "../../../../util/BsimUtil";
import { isAny } from "../util/ModelingUtil";

var bsimRefs = new Refs(
  { name: "bpmnElement", enumerable: true },
  { name: "bsim", configurable: true }
);

export default class CreateElementHandler {
  constructor(moddle) {
    this._moddle = moddle;
  }
  $inject = ["moddle"];

  execute = function (context) {
    var bsim = context.shape,
      parent = context.parent,
      businessObject = context.host;

    if (!businessObject) {
      // not always required. ;)
    }

    bsimRefs.bind(businessObject, "bsim");
    businessObject.bsim = bsim;

    // find the parent simulation configuration
    if (
      !parent &&
      isAny(businessObject.$parent, ["bpmn:Process", "bpmn:SubProcess"])
    ) {
      parent = businessObject.$parent.bsim;
    }
    context.parent = parent;

    if (parent) {
      bsim.$parent = parent;
      if (is(bsim, "bsim:task")) {
        ensureModdleProperty(parent, "bsim:tasks");
        parent.tasks.push(bsim);
      } else if (is(bsim, "bsim:exclusiveGateway")) {
        ensureModdleProperty(parent, "bsim:gateways");
        parent.gateways.push(bsim);
      } else if (is(bsim, "bsim:catchEvent")) {
        ensureModdleProperty(parent, "bsim:events");
        parent.events.push(bsim);
      } else if (is(bsim, "bsim:dataObject")) {
        ensureModdleProperty(parent, "bsim:dataObjects");
        parent.dataObjects.push(bsim);
      } else if (is(bsim, "bsim:subProcess")) {
        parent.get("bsim:subProcesses").push(bsim);
      } else if (is(bsim, "bsim:startEvent")) {
        parent.startEvent = bsim;
      } else if (is(bsim, "bsim:dynamicResource")) {
        parent.resourceData.dynamicResource.push(bsim);
      }
    }
    return bsim;
  };

  revert = function (context) {
    var bsim = context.shape,
      parent = context.parent,
      businessObject = context.host;

    if (businessObject) {
      businessObject.bsim = undefined;
    }

    if (parent) {
      let container;
      if (is(bsim, "bsim:task")) {
        container = parent.tasks;
      } else if (is(bsim, "bsim:exclusiveGateway")) {
        container = parent.gateways;
      } else if (is(bsim, "bsim:catchEvent")) {
        container = parent.events;
      } else if (is(bsim, "bsim:dataObject")) {
        container = parent.dataObjects;
      } else if (is(bsim, "bsim:startEvent")) {
        parent.startEvent = undefined;
      }

      if (container) {
        const idx = container.findIndex(
          (element) => element.id.id === bsim.id.id
        );
        container.splice(idx, 1);
      }
    }

    bsim.$parent = undefined;
  };
}
