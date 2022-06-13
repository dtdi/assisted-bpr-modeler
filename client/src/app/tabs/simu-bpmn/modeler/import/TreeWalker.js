import { filter, find, forEach } from "min-dash";

import Refs from "object-refs";

import { elementToString } from "bpmn-js/lib/import/Util";

var bsimRefs = new Refs(
  { name: "bpmnElement", enumerable: true },
  { name: "bsim", configurable: true }
);

var timetableRefs = new Refs(
  { name: "resources", enumerable: true, collection: true },
  { name: "timetable", configurable: true }
);

/**
 * Returns true if an element has the given meta-model type
 *
 * @param  {ModdleElement}  element
 * @param  {string}         type
 *
 * @return {boolean}
 */
export function is(element, type) {
  return element.$instanceOf(type);
}

/**
 * Find a suitable display candidate for definitions where the DI does not
 * correctly specify one.
 */
function findTimeTableCandidate(id, timetables) {
  return find(timetables.timetable, function (e) {
    return is(e, "bsim:timetable") && e.id === id;
  });
}

export default function BpmnTreeWalker(handler, translate, moddle, modeling) {
  // list of containers already walked
  var handledElements = {};

  // list of elements to handle deferred to ensure
  // prerequisites are drawn
  var deferred = [];

  // Helpers //////////////////////

  function contextual(fn, ctx) {
    return function (e) {
      fn(e, ctx);
    };
  }

  function handled(element) {
    handledElements[element.id] = element;
  }

  function isHandled(element) {
    return handledElements[element.id];
  }

  function visitDefinitions(element) {
    return handler.definitions(element);
  }

  function visit(element, ctx) {
    var bsim = element.bsim;

    // avoid multiple rendering of elements
    if (bsim) {
      throw new Error(
        translate("already bsimed {element}", {
          element: elementToString(element),
        })
      );
    }

    // call handler
    return handler.element(element, ctx);
  }

  // if no bsim element is assigned, create a new.
  function visitIfBsim(element, ctx) {
    try {
      var bsim = element.bsim || visit(element, ctx);

      if (!element.bsim) {
        //console.log(`creating ${elementToString(element)}`);
        bsimRefs.bind(element, "bsim");
        element.bsim = bsim;
      } else {
        //console.log(`bsim element existing for ${elementToString(element)}`);
      }

      handled(element);

      return bsim;
    } catch (e) {
      logError(e.message, { element: element, error: e });

      console.error(
        translate("failed to import {element}", {
          element: elementToString(element),
        })
      );
      console.error(e);
    }
  }

  function logError(message, context) {
    handler.error(message, context);
  }

  // Res handling /////////////////////

  function registerRes(resource, timetable) {
    let ttRef =
      resource.timetable || resource.defaultTimetableId || resource.timetabeId;
    let ttElement;

    if (typeof ttRef === "string")
      ttElement = findTimeTableCandidate(ttRef, timetable);
    else ttElement = ttRef;

    if (ttElement) {
      if (ttElement.resources) {
        resource.timetable = ttElement;
        ttElement.resources.add(resource);
      } else {
        resource.timetable = ttElement;
        timetableRefs.bind(ttElement, "resources");
        ttElement.resources.add(resource);
      }
    }
  }

  function handleResData(resourceData, timetables) {
    if (!resourceData.dynamicResource) return;
    resourceData.dynamicResource.forEach((resource) =>
      handleDynamicResource(resource, timetables)
    );
  }

  function handleDynamicResource(resource, timetables) {
    //registerRes(resource, timetables);

    if (!resource.instance) return;
    resource.instance.forEach((instance) =>
      handleResourceInstance(instance, timetables)
    );
  }

  function handleResourceInstance(resource) {
    //registerRes(resource);
  }

  // DI handling //////////////////////

  function registerBsim(bsim) {
    if (!bsim) return;
    var bpmnElement = bsim.bpmnElement || bsim.id;

    if (bpmnElement) {
      if (bpmnElement.bsim) {
        logError(
          translate("multiple BSIM elements defined for {element}", {
            element: elementToString(bpmnElement),
          }),
          { element: bpmnElement }
        );
      } else {
        bsimRefs.bind(bpmnElement, "bsim");
        bpmnElement.bsim = bsim;
      }
    } else {
      logError(
        translate("no bpmnElement referenced in {element}", {
          element: elementToString(bsim),
        }),
        { element: bsim }
      );
    }
  }

  // Semantic handling //////////////////////

  /**
   * Handle definitions and return the rendered diagram (if any)
   *
   * @param {ModdleElement} definitions to walk and import
   * @param {ModdleElement} [diagram] specific diagram to import and display
   *
   * @throws {Error} if no diagram to display could be found
   */
  function handleDefinitions(definitions, diagram) {
    // make sure we walk the correct bpmnElement

    var diagrams = definitions.diagrams;

    if (diagram && diagrams.indexOf(diagram) === -1) {
      throw new Error(translate("diagram not part of bpmn:Definitions"));
    }

    if (!diagram && diagrams && diagrams.length) {
      diagram = diagrams[0];
    }

    // no diagram -> nothing to import
    if (!diagram) {
      throw new Error(translate("no diagram to display"));
    }

    var plane = diagram.plane;

    if (!plane) {
      throw new Error(
        translate("no plane for {element}", {
          element: elementToString(diagram),
        })
      );
    }

    var rootElement = plane.bpmnElement;

    // the first simuConf Element?
    visitDefinitions(definitions);

    // walk the resource information
    const resourceData = definitions.get("resourceData");
    const timetables = definitions.get("timetables");

    handleResData(resourceData, timetables);

    const ctx = definitions.get("bsim:simulationConfiguration");

    if (is(rootElement, "bpmn:Process")) {
      handleProcess(rootElement, ctx);
    } else if (is(rootElement, "bpmn:Collaboration")) {
      handleCollaboration(rootElement, ctx);
    } else {
      throw new Error(
        translate("unsupported bpmnElement for {plane}: {rootElement}", {
          plane: elementToString(plane),
          rootElement: elementToString(rootElement),
        })
      );
    }

    // handle all deferred elements
    handleDeferred(deferred);
  }

  function handleDeferred() {
    var fn;

    // drain deferred until empty
    while (deferred.length) {
      fn = deferred.shift();

      fn();
    }
  }

  function visitIfGateway(bsim) {
    registerBsim(bsim);
    forEach(bsim.get("outgoing"), registerBsim);
  }

  function visitIfTask(bsim) {
    registerBsim(bsim);
    const boundaryEvents = bsim.get("boundaryEvents");
    if (boundaryEvents) {
      forEach(bsim.get("boundaryEvents").boundaryEvent, registerBsim);
    }
  }

  function handleSimuConfig(process) {
    const simuConf = process.bsim;

    forEach(simuConf.get("tasks"), visitIfTask);
    forEach(simuConf.get("gateways"), visitIfGateway);
    forEach(simuConf.get("dataObjects"), registerBsim);
    forEach(simuConf.get("events"), registerBsim);
    registerBsim(simuConf.get("startEvent"));
    forEach(simuConf.get("subProcesses"), handleSimuConfig);
  }

  function handleProcess(process, context) {
    visitIfBsim(process, context);

    handleSimuConfig(process);

    handleFlowElementsContainer(process, process.bsim);
    // log process handled
    handled(process);
  }

  function handleSubProcess(subProcess, context) {
    handleFlowElementsContainer(subProcess, context);
  }

  function handleFlowNode(flowNode, context) {
    var childCtx = visitIfBsim(flowNode, context);

    if (is(flowNode, "bpmn:SubProcess")) {
      handleSubProcess(flowNode, childCtx || context);
    }

    if (is(flowNode, "bpmn:Activity")) {
    }
  }

  function handleSequenceFlow(sequenceFlow, context) {
    visitIfBsim(sequenceFlow, context);
  }

  function handleDataElement(dataObject, context) {
    visitIfBsim(dataObject, context);
  }

  function handleLane(lane, context) {
    deferred.push(function () {
      var newContext = visitIfBsim(lane, context);

      if (lane.childLaneSet) {
        handleLaneSet(lane.childLaneSet, newContext || context);
      }
    });
  }

  function handleLaneSet(laneSet, context) {
    forEach(laneSet.lanes, contextual(handleLane, context));
  }

  function handleLaneSets(laneSets, context) {
    forEach(laneSets, contextual(handleLaneSet, context));
  }

  function handleFlowElementsContainer(container, context) {
    handleFlowElements(container.flowElements, context);

    if (container.laneSets) {
      handleLaneSets(container.laneSets, context);
    }
  }

  function handleFlowElements(flowElements, context) {
    forEach(flowElements, function (e) {
      if (is(e, "bpmn:SequenceFlow")) {
        deferred.push(function () {
          handleSequenceFlow(e, context);
        });
      } else if (is(e, "bpmn:BoundaryEvent")) {
        deferred.unshift(function () {
          handleFlowNode(e, context);
        });
      } else if (is(e, "bpmn:FlowNode")) {
        handleFlowNode(e, context);
      } else if (is(e, "bpmn:DataObject")) {
        // SKIP (assume correct referencing via DataObjectReference)
      } else if (is(e, "bpmn:DataStoreReference")) {
        handleDataElement(e, context);
      } else if (is(e, "bpmn:DataObjectReference")) {
        handleDataElement(e, context);
      } else {
        logError(
          translate("unrecognized flowElement {element} in context {context}", {
            element: elementToString(e),
            context: context ? elementToString(context.businessObject) : "null",
          }),
          { element: e, context: context }
        );
      }
    });
  }

  function handleParticipant(participant, context) {
    var process = participant.processRef;
    if (process) {
      handleProcess(process, context);
    }
  }

  function handleCollaboration(collaboration, context) {
    forEach(collaboration.participants, contextual(handleParticipant, context));
  }

  // API //////////////////////

  return {
    handleDefinitions: handleDefinitions,
    handleSubProcess: handleSubProcess,
    registerDi: registerBsim,
  };
}
