import inherits from "inherits";

import BaseModeling from "bpmn-js/lib/features/modeling/Modeling";

import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import SpreadElementsHandler from "./cmd/SpreadElementsHandler";
import CreateElementHandler from "./cmd/CreateElementHandler";
import RemoveElementHandler from "./cmd/RemoveElementHandler";
import UpdateModdlePropertiesHandler from "./cmd/UpdateModdlePropertiesHandler";

/**
 * BSIM modeling features activator
 *
 * @param {EventBus} eventBus
 * @param {ElementFactory} elementFactory
 * @param {CommandStack} commandStack
 * @param {BsimRules} bpmnRules
 */
export default function Modeling(
  eventBus,
  elementFactory,
  commandStack,
  bpmnRules,
  bsimRules,
  bsimFactory
) {
  BaseModeling.call(this, eventBus, elementFactory, commandStack, bpmnRules);

  this._bsimRules = bsimRules;
  this._bsimFactory = bsimFactory;
}

inherits(Modeling, BaseModeling);

Modeling.$inject = [
  "eventBus",
  "elementFactory",
  "commandStack",
  "bpmnRules",
  "bsimRules",
  "bsimFactory",
];

Modeling.prototype.getHandlers = function () {
  var handlers = BaseModeling.prototype.getHandlers.call(this);

  handlers["elements.spread"] = SpreadElementsHandler;
  handlers["bsim.element.create"] = CreateElementHandler;
  handlers["bsim.element.remove"] = RemoveElementHandler;
  handlers["bsim.resource.remove"] = RemoveElementHandler;
  //handlers["bsim.element.updateDistribution"] = null;
  //handlers["bsim.element.updateResources"] = null;
  //handlers["bsim.element.updateBoundaryEvent"] = null;
  handlers["bsim.element.updateModdleProperties"] =
    UpdateModdlePropertiesHandler;
  return handlers;
};

Modeling.prototype.spreadElements = function (groups, axis, dimension) {
  var context = {
    groups: groups,
    axis: axis,
    dimension: dimension,
  };

  this._commandStack.execute("elements.spread", context);
};

Modeling.prototype.createBsimElement = function (shapeAttrs, hostBO, hints) {
  hints = hints || {};

  parent = hints.parent;
  let type;
  if (is(hostBO, "bpmn:Task")) {
    type = "bsim:task";
  } else if (is(hostBO, "bpmn:StartEvent")) {
    type = "bsim:startEvent";
  } else if (is(hostBO, "bpmn:SubProcess")) {
    type = "bsim:subProcess";
  } else if (is(hostBO, "bpmn:ExclusiveGateway")) {
    type = "bsim:exclusiveGateway";
  } else if (is(hostBO, "bpmn:DataObjectReference")) {
    type = "bsim:dataObject";
  } else if (is(hostBO, "bpmn:BoundaryEvent")) {
    type = "bsim:boundaryEvent";
  } else if (is(hostBO, "bpmn:SequenceFlow")) {
    type = "bsim:outgoingSequenceFlow";
  } else if (is(hostBO, "bpmn:CatchEvent")) {
    type = "bsim:catchEvent";
  } else if (is(hostBO, "bpmn:Lane")) {
    type = "bsim:dynamicResource";
  }

  const shape = this._createBsim(type, shapeAttrs);

  var context = {
    shape: shape, // the bsim element
    parent: hints.parent, // the simulation configuration
    host: hostBO, // the parent business Object
    hints: hints, //
  };

  this._commandStack.execute("bsim.element.create", context);

  return context.shape;
};

Modeling.prototype.removeBsimElement = function (bsim, businessObject, hints) {
  hints = hints || {};

  var context = {
    bsim: bsim, // the bsim element
    host: businessObject, // the parent business Object
    hints: hints, //
  };

  this._commandStack.execute("bsim.element.remove", context);

  return context.shape;
};

Modeling.prototype.removeResource = function (resource, resourceData) {
  var bsimRules = this._bsimRules;

  const attrs = bsimRules.canRemoveResource(resource, resourceData);

  if (!attrs) {
    return;
  }

  this.updateModdleProperties(resourceData, resourceData, {
    dynamicResource: resourceData.dynamicResource.filter(
      (elem) => elem !== resource
    ),
  });

  this._commandStack.execute("bsim.resource.remove", context);
};

Modeling.prototype.getExtensionElementByName = function (element, type) {
  element = getBusinessObject(element);

  const config = element.get("extensionElements");
  if (!config) return;
  let values = config.get("values") || [];
  const properties = values.find((item) => is(item, type));
  return properties;
};

Modeling.prototype.getProperty = function (element, id) {
  const properties = this.getExtensionElementByName(element, "abpr:properties");
  if (!properties) return;
  let values = properties.get("values") || [];
  const property = values.find((item) => item.id == id);
  return property;
};

Modeling.prototype.getProp = function (element, id) {
  element = getBusinessObject(element);

  const property = this.getProperty(element, id);
  if (!property) return;
  switch (property.type) {
    case "boolean":
      return property.value == "true";
    default:
      return property.value;
  }
};

Modeling.prototype.setProperty = function (element, property) {};

Modeling.prototype.setProp = function (element, id, value, related) {
  element = getBusinessObject(element);
  let config = element.get("extensionElements");
  if (!config) {
    config = this._bsimFactory.create("bpmn:ExtensionElements", { values: [] });
    this.updateModdleProperties(element, element, {
      extensionElements: config,
    });
  }
  let values = config.get("values") || [];
  const values_wo = values.filter((item) => !is(item, "abpr:properties"));
  let abprProps = values.find((item) => is(item, "abpr:properties"));
  if (!abprProps) {
    abprProps = this._bsimFactory.create("abpr:properties", { values: [] });
  }
  values = abprProps.get("values") || [];
  const dtdiProps_wo = values.filter((item) => item.id !== id);
  let property = values.find((item) => item.id === id);
  if (property) {
    property.set("abpr:value", String(value));
    property.set("abpr:type", typeof value);
  } else {
    property = this._bsimFactory.create("abpr:property", {
      id: id,
      value: String(value),
      type: typeof value,
      related: related,
    });
  }
  this.updateModdleProperties(element, abprProps, {
    values: [...dtdiProps_wo, property],
  });

  this.updateModdleProperties(element, config, {
    values: [...values_wo, abprProps],
  });
};

Modeling.prototype.updateBsimName = function (bsim, newLabel, oldLabel, hints) {
  const context = {
    element: bsim,
    oldLabel: oldLabel,
    newLabel: newLabel,
    hints: hints,
  };
  this._commandStack.execute("bsim.element.rename", context);
};

Modeling.prototype._createBsim = function (type, attrs) {
  return this._bsimFactory.create(type, attrs);
};
