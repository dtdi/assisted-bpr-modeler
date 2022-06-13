import { is } from "bpmn-js/lib/util/ModelUtil";

export default class RemoveElementHandler {
  /**
   * {
    bsim: bsim, // the bsim element
    oldParent: oldParent, // the parent simulationConfiguration
    host: businessObject, // the parent business Object
    hints: hints, //
  };
   * @param {*} context 
   */

  execute = function (context) {
    var bsim = context.bsim,
      oldParent = bsim.$parent,
      businessObject = context.host;

    if (businessObject) {
      businessObject.bsim = undefined;
    }

    if (oldParent) {
      context.oldParent = oldParent;
      let container;
      if (is(bsim, "bsim:task")) {
        container = oldParent.tasks;
      } else if (is(bsim, "bsim:exclusiveGateway")) {
        container = oldParent.gateways;
      } else if (is(bsim, "bsim:catchEvent")) {
        container = oldParent.events;
      } else if (is(bsim, "bsim:dataObject")) {
        container = oldParent.dataObjects;
      } else if (is(bsim, "bsim:startEvent")) {
        oldParent.startEvent = undefined;
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

  revert = function (context) {
    var bsim = context.bsim,
      host = context.host,
      oldParent = context.oldParent;

    if (host) {
      host.bsim = bsim;
    }

    bsim.$parent = oldParent;

    if (is(bsim, "bsim:task")) {
      oldParent.tasks.push(bsim);
    } else if (is(bsim, "bsim:exclusiveGateway")) {
      oldParent.gateways.push(bsim);
    } else if (is(bsim, "bsim:catchEvent")) {
      oldParent.events.push(bsim);
    } else if (is(bsim, "bsim:dataObject")) {
      oldParent.dataObjects.push(bsim);
    } else if (is(bsim, "bsim:startEvent")) {
      oldParent.startEvent = bsim;
    }

    return bsim;
  };
}
