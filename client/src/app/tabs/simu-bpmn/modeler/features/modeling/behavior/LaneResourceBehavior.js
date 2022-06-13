import inherits from "inherits";

import CommandInterceptor from "diagram-js/lib/command/CommandInterceptor";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";

export default function LaneResourceBehavior(injector, modeling, bpmnjs) {
  injector.invoke(CommandInterceptor, this);

  this.postExecute("element.updateLabel", function (event) {
    const { context } = event;
    const { element: shape } = context;
    const element = getBusinessObject(shape);
    const bsim = element.bsim;

    if (!is(element, "bpmn:Lane")) return;

    if (!bsim) {
      const resourceData = bpmnjs._definitions.get("resourceData");
      let laneRes = resourceData
        .get("dynamicResource")
        .find((r) => r.name === element.name);
      if (!laneRes) {
        laneRes = modeling.createBsimElement(
          {
            name: element.name,
            defaultTimeUnit: "MINUTES",
            defaultCost: 20,
            defaultQuantity: 1,
            defaultTimetableId: bpmnjs._definitions
              .get("timetables")
              .get("timetable")[0],
          },
          element
        );

        resourceData.get("bsim:dynamicResource").push(laneRes);
      }
      laneRes.set("bpmnElement", element);
      element.bsim = laneRes;
    } else {
      modeling.updateModdleProperties(bsim, bsim, { name: element.name });
    }
  });
}

LaneResourceBehavior.$inject = ["injector", "modeling", "bpmnjs"];

inherits(LaneResourceBehavior, CommandInterceptor);
