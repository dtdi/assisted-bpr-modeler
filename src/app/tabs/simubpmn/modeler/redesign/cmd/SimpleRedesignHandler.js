import inherits from "inherits";
import { merge } from "min-dash";
import { compareAgainst } from "../../../util/BsimUtil";

import Handler from "./Handler";

export default function SimpleRedesignHandler(
  eventBus,
  moddle,
  commandStack,
  modeling,
  redesignStack,
  elementRegistry,
  elementFactory,
  injector
) {
  const self = this;
  Handler.call(
    this,
    eventBus,
    moddle,
    commandStack,
    modeling,
    redesignStack,
    elementRegistry
  );

  self._elementFactory = elementFactory;
  self._injector = injector;
}

SimpleRedesignHandler.$inject = [
  "eventBus",
  "moddle",
  "commandStack",
  "modeling",
  "redesignStack",
  "elementRegistry",
  "elementFactory",
  "injector",
];

inherits(SimpleRedesignHandler, Handler);

SimpleRedesignHandler.prototype.execute = function (context, newContext) {};

/**
 * commit and possible simulate.
 */
SimpleRedesignHandler.prototype.commit = async function (context, newContext) {
  merge(context, newContext);

  const self = this;

  context.actions = self._commandStack._stack.filter(
    (stackItem, idx) =>
      stackItem.id >= context._initUid && idx < self._commandStack._stackIdx
  );

  context.shapes = context.shapes || [];

  //delete context.commandStack;

  /**
   * Run a simulation experiment to validate changes before mvoing to the next part
   */
  await self.evaluate(context);
  return context;
};

SimpleRedesignHandler.prototype.finalize = function (context, newContext) {};
