import inherits from "inherits";

import CommandInterceptor from "diagram-js/lib/command/CommandInterceptor";
import { isAny } from "../util/ModelingUtil";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

export default function CreateBehavior(injector, modeling, elementRegistry) {
  injector.invoke(CommandInterceptor, this);

  // Detect if a new shape has been added to the process
  this.postExecute("shape.create", 1500, function (event) {
    var context = event.context,
      shape = context.shape,
      businessObject = shape.businessObject,
      hints = { host: context.host };

    // (*) exclude exclusive gateways here, as only the amount of outgoing flows determines the BSIM status.
    if (!_isRelevant(businessObject)) {
      return;
    }
    // Trigger the creation of a new bsim element and attach it to the business object
    modeling.createBsimElement({ id: businessObject }, businessObject, hints);
  });

  // Detect if a shape has been deleted from the process
  this.postExecute("shape.delete", function (event) {
    var context = event.context,
      shape = context.shape,
      businessObject = shape.businessObject,
      hints = {};
    if (!_isRelevant(businessObject)) {
      return;
    }
    // Trigger the creation of a new bsim element and attach it to the business object
    modeling.removeBsimElement(businessObject.bsim, businessObject, hints);
  });

  this.preExecute("element.updateLabel", (event) => {
    var context = event.context,
      element = context.element;
    if (!element.businessObject)
      context.element = elementRegistry.get(element.id);
  });

  /** On Update label, we want to change a tasks label. */
  this.postExecute("element.updateLabel", function (event) {
    var context = event.context,
      element = context.element,
      businessObject = getBusinessObject(element),
      newLabel = context.newLabel;

    if (!_isRelevant(businessObject)) {
      return;
    }

    const bsim = businessObject.bsim;

    /** Update the name of the element */
    modeling.updateModdleProperties(bsim, bsim, { name: newLabel });
  });
}

function _isRelevant(businessObject) {
  // don't add gateways here.
  return isAny(businessObject, [
    "bpmn:Task",
    "bpmn:StartEvent",
    "bpmn:DataObjectReference",
    "bpmn:BoundaryEvent",
    "bpmn:CatchEvent",
  ]);
}

CreateBehavior.$inject = ["injector", "modeling", "elementRegistry"];

inherits(CreateBehavior, CommandInterceptor);
