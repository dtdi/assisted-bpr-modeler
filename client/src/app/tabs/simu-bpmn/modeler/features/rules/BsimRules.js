import { is } from "bpmn-js/lib/util/ModelUtil";
import RuleProvider from "diagram-js/lib/features/rules/RuleProvider";
import inherits from "inherits";
import { isAny } from "../modeling/util/ModelingUtil";

const HIGH_PRIORITY = 1500;

/**
 * BPMN specific modeling rule
 */
export default function BsimRules(eventBus, elementRegistry) {
  RuleProvider.call(this, eventBus);
  this._elementRegistry = elementRegistry;
}

inherits(BsimRules, RuleProvider);

BsimRules.$inject = ["eventBus", "elementRegistry"];

BsimRules.prototype.canRemoveResource = canRemoveResource;

BsimRules.prototype.init = function () {
  const self = this;

  // only allow 1 start event
  this.addRule("shape.create", HIGH_PRIORITY, function (context) {
    var shape = context.shape;
    var bO = shape.businessObject;
    if (is(bO, "bpmn:StartEvent")) {
      var isFound = self._elementRegistry.find((ele) =>
        is(ele, "bpmn:StartEvent")
      );
      if (isFound) {
        return false;
      }
    }
  });
};

/**
 * Utility functions for rule checking
 */

/**
 * Checks if given element can be used for starting connection.
 *
 * @param  {Element} source
 * @return {boolean}
 */
function canRemoveResource(resource, resourceData) {
  return false;
}
