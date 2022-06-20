import inherits from "inherits";

import CommandInterceptor from "diagram-js/lib/command/CommandInterceptor";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";

/**
 * BPMN-specific replace behavior.
 */
export default function ReplaceElementBehavior(injector, modeling) {
  injector.invoke(CommandInterceptor, this);

  // keep ID on shape replace
  this.preExecuted(["shape.replace"], 1500, function (e) {
    var context = e.context,
      oldShape = context.oldShape;
    const oldBsim = getBusinessObject(oldShape).bsim;
    if (oldBsim) {
      context.oldBsim = oldBsim;
      context.oldBsimHost = context.oldBsim.$parent;
    }
  });

  // keep ID on shape replace
  this.postExecuted(["shape.replace"], 1500, function (e) {
    var context = e.context,
      newShape = context.newShape;
    if (context.oldBsim) {
      context.oldBsim.$parent = context.oldBsimHost;
      getBusinessObject(newShape).bsim = context.oldBsim;
    }
  });

  // keep ID on shape replace
  this.postExecuted(["element.updateAttachment"], 1500, function (e) {
    var context = e.context,
      shape = context.shape,
      oldHost = context.oldHost,
      newHost = context.newHost;

    if (is(shape, "bpmn:BoundaryEvent")) {
      const bsim = getBusinessObject(shape).bsim;
      if (newHost && getBusinessObject(newHost).bsim) {
        const hostBsim = getBusinessObject(newHost).bsim;

        //console.log(hostBsim.get("boundaryEvents"));
        modeling.updateModdleProperties(hostBsim, "bsim:boundaryEvents", {
          boundaryEvent: [bsim],
        });
      }
    }
  });
}

inherits(ReplaceElementBehavior, CommandInterceptor);
