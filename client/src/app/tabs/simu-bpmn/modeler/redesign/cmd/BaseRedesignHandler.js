import inherits from "inherits";

import Handler from "./Handler";

export default function BaseRedesignHandler(
  eventBus,
  moddle,
  commandStack,
  modeling,
  redesignStack,
  elementRegistry
) {
  Handler.call(
    this,
    eventBus,
    moddle,
    commandStack,
    modeling,
    redesignStack,
    elementRegistry
  );

  const self = this;
  self.current = undefined;
}
inherits(BaseRedesignHandler, Handler);

BaseRedesignHandler.prototype._simulate = function (context) {
  var res, rej;
  const self = this;

  const abortController = new AbortController();
  const { signal } = abortController;

  var promise = new Promise((resolve, reject) => {
    res = resolve;
    rej = reject;

    self._moddle.toXML(self._definitions, { format: true }).then((res) => {
      self
        ._evaluate(res.xml, "baseline", self._moddle, signal)
        .then((value) => {
          if (!value) return;
          value.groups[3] &&
            value.groups[3].children &&
            value.groups[3].children.forEach((activity) => {
              activity.name = self._elementRegistry.get(
                activity.key
              ).businessObject.name;
            });
          return value;
        })
        .then((value) => {
          const { items, groups, activities } = value;
          const performance = {
            ...(context.performance || {}),
            values: items,
            groups: groups,
            baseline: { items, activities },
          };

          resolve(performance);
        });
    });
  }).catch(() => {
    abortController.abort();
  });

  promise.resolve = res;
  promise.reject = rej;

  return promise;
};

BaseRedesignHandler.prototype.evaluate = async function (context) {
  const self = this;
  if (!self._definitions) {
    throw new Error("definitions is not defined");
  }

  // (1) return current running simulation
  if (self.simulation && !context.restart) {
    return self.simulation;
  }

  // (2) reset simulation
  if (self.simulation && context.restart) {
    self.simulation.reject("cancelled request");
  }

  // (3) restart simulation
  if (!self.current || context.restart) {
    self.simulation = self._simulate(context);
    self.simulation.then((performance) => (self.current = performance));
    return self.simulation;
  }

  // (4) return the default
  return new Promise((res, rej) => {
    res(self.current);
  });
};

BaseRedesignHandler.$inject = [
  "eventBus",
  "moddle",
  "commandStack",
  "modeling",
  "redesignStack",
  "elementRegistry",
];
