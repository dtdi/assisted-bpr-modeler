import BpmnTreeWalker, { is } from "../../import/TreeWalker";
import { format, startOfWeek } from "date-fns";

const LOW_PRIORITY = 500;

export default class BsimImporter {
  $inject = ["eventBus", "moddle", "translate", "modeling"];

  constructor(eventBus, moddle, translate, modeling) {
    this._eventBus = eventBus;
    this._moddle = moddle;
    this._translate = translate;
    this._modeling = modeling;
    const self = this;
    self._simElements = [];
    this._eventBus.on(["import.parse.complete"], LOW_PRIORITY, function (e) {
      self.initTree(e);
    });
  }

  /**
   *
   */
  initTree(event) {
    const { definitions, elementsById, references } = event;
    const self = this,
      moddle = this._moddle,
      modeling = this._modeling,
      warnings = [];
    self._simElements = [];

    const DEFAULT_TIMETABLE_ID = "DEFAULT";
    let defaultTimetable;

    var visitor = {
      definitions: function (definitions) {
        if (!definitions.get("bsim:bsim:resourceAssignmentOrder"))
          definitions.set("bsim:resourceAssignmentOrder", "simulationTime");

        if (!definitions.get("bsim:zoneOffset"))
          definitions.set("bsim:zoneOffset", "+01:00");

        if (!definitions.get("bsim:timetables")) {
          const timetables = moddle.create("bsim:timetables");
          definitions.set("bsim:timetables", timetables);
        }

        if (
          definitions.get("bsim:timetables").get("bsim:timetable").length === 0
        ) {
          const timetables = definitions.get("bsim:timetables");
          defaultTimetable = moddle.create("bsim:timetable", {
            id: DEFAULT_TIMETABLE_ID,
          });
          defaultTimetable.get("bsim:timetableItem").push(
            moddle.create("bsim:timetableItem", {
              from: "MONDAY",
              to: "FRIDAY",
              beginTime: "09:00:00",
              endTime: "17:00:00",
            })
          );
          timetables.get("bsim:timetable").push(defaultTimetable);
        } else {
          defaultTimetable = definitions
            .get("bsim:timetables")
            .get("bsim:timetable")[0];
        }
        if (!definitions.get("bsim:resourceData")) {
          const resourceData = moddle.create("bsim:resourceData");
          definitions.set("bsim:resourceData", resourceData);
        }

        if (
          definitions.get("bsim:resourceData").get("bsim:dynamicResource")
            .length === 0
        ) {
          const resourceData = definitions.get("bsim:resourceData");
          resourceData.get("bsim:dynamicResource").push(
            moddle.create("bsim:dynamicResource", {
              id: "defaultResource",
              defaultQuantity: 1,
              defaultTimeUnit: "MINUTES",
              defaultCost: 20,
              defaultQuantity: 1,
              defaultTimetableId: defaultTimetable,
            })
          );
        }
      },
      element: function (element, ctx) {
        let bsim;
        if (is(element, "bpmn:Process")) {
          // (1) find the right bsim and attach its elements to the process.
          bsim = ctx.find((bsim) => bsim.processRef === element);
          if (!bsim) {
            bsim = moddle.create("bsim:simulationConfiguration", {
              processRef: element,
              randomSeed: Math.floor(Math.random() * 20000),
              processInstances: 200,
              startDateTime: format(
                startOfWeek(new Date(), { weekStartsOn: 1 }),
                "yyyy-MM-dd'T'HH:mm"
              ),
            });
            ctx.push(bsim);
          }
        } else if (is(element, "bpmn:StartEvent")) {
          bsim = modeling.createBsimElement({ id: element }, element);
        } else if (is(element, "bpmn:Activity")) {
          bsim = modeling.createBsimElement({ id: element }, element);
        } else if (
          is(element, "bpmn:ExclusiveGateway") &&
          element.get("outgoing").length >= 2
        ) {
          bsim = modeling.createBsimElement({ id: element }, element);
        } else if (is(element, "bpmn:BoundaryEvent")) {
          bsim = modeling.createBsimElement({ id: element }, element);
        } else if (is(element, "bpmn:SubProcess")) {
          bsim = modeling.createBsimElement({ id: element }, element);
        } else if (is(element, "bpmn:CatchEvent")) {
          bsim = modeling.createBsimElement({ id: element }, element);
        } else if (is(element, "bpmn:Lane")) {
          if (!element.name) return;
          const resourceData = definitions.get("resourceData");
          let laneRes = resourceData
            .get("dynamicResource")
            .find((r) => r.name === element.name);
          if (!laneRes) {
            laneRes = moddle.create("bsim:dynamicResource", {
              name: element.name,
              defaultTimeUnit: "MINUTES",
              defaultCost: 20,
              defaultQuantity: 1,
              defaultTimetableId: defaultTimetable,
            });
            laneRes.set("id", moddle.ids.nextPrefixed("Resource", laneRes));

            resourceData.get("bsim:dynamicResource").push(laneRes);
          }
          laneRes.set("bpmnElement", element);
          element.bsim = laneRes;
        }

        self._simElements[element.id] = element;

        return bsim; // importer.add(element, parentShape);
      },

      error: function (message, context) {
        warnings.push({ message: message, context: context });
      },
    };

    const walker = new BpmnTreeWalker(
      visitor,
      this._translate,
      this._moddle,
      this._modeling
    );
    walker.handleDefinitions(definitions);

    self._eventBus.fire("bsim.import.completed", {
      elements: this._simElements,
    });
  }
}
