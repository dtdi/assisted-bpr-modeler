import { compareAgainst, simulationResult } from "../../../util/BsimUtil";
import MinModeler from "../../MinModeler";

export default function Handler(
  eventBus,
  moddle,
  commandStack,
  modeling,
  redesignStack,
  elementRegistry
) {
  const self = this;
  self._eventBus = eventBus;
  self._moddle = moddle;
  self._commandStack = commandStack;
  self._modeling = modeling;
  self._redesignStack = redesignStack;
  self._elementRegistry = elementRegistry;
  self._minModeler = new MinModeler();

  self.DEFAULT_COMMIT_MSG = "Your commit message";

  eventBus.on("import.parse.complete", (event) => {
    self._definitions = event.definitions;
  });
}

Handler.$inject = [
  "eventBus",
  "moddle",
  "commandStack",
  "modeling",
  "redesignStack",
  "elementRegistry",
];

Handler.prototype.initialize = function (context) {
  const self = this;
  context._initUid = self._commandStack._uid;
  context.commandStack = self._commandStack;

  // ensure base simulation
};

Handler.prototype.stash = async function (context, newContext) {
  const self = this;
  let undoAction = self._commandStack._getUndoAction();
  while (!!undoAction && undoAction.id >= context._initUid) {
    self._commandStack.undo();
    undoAction = self._commandStack._getUndoAction();
  }

  this._eventBus.fire("redesign.editMode.stashed", {
    data: context,
  });
};

Handler.prototype._getBaseSimulation = function (context) {
  return this._redesignStack.evaluate("idea.base", context);
};

Handler.prototype.evaluate = async function (context) {
  const self = this;

  return new Promise((res, rej) => {
    self._moddle
      // 1) serialize current model
      .toXML(self._definitions, {
        format: true,
      })
      // 2) simulate the redesign as well as the base simulation
      .then((serialized) => {
        return Promise.all([
          self._evaluate(
            serialized.xml,
            "simulation",
            self._moddle,
            context.abortSignal
          ),
          self._getBaseSimulation({ signal: context.abortSignal }),
        ]);
      })
      .then((value) => {
        value[0].groups[3] &&
          value[0].groups[3].children &&
          value[0].groups[3].children.forEach((activity) => {
            activity.name = self._elementRegistry.get(
              activity.key
            ).businessObject.name;
          });
        return value;
      })

      // 3) build comparison between scenario and baseline and resolve the promise
      .then((results) => {
        const scenario = results[0],
          base = results[1];
        const items2 = compareAgainst(base.values, scenario.items);
        const performance = {
          simulation: {
            items: scenario.items,
            activities: scenario.activities,
          },
          baseline: base.baseline,
          values: items2,
          key: context.key,
          groups: scenario.groups,
        };
        context.performance = performance;
        res(context);
      })
      .catch((err) => rej(err));
  });
};

// _evaluate helper function
Handler.prototype._evaluate = async function (
  importXml,
  sfx,
  moddle,
  abortSignal
) {
  const that = this;
  try {
    abortSignal.addEventListener("abort", () => {
      console.log("cancel simulation executions");
      that._eventBus.fire("abpr.simulate.abort");
    });

    const response = await that._eventBus.fire("abpr.simulate", {
      contents: importXml,
    });

    if (response.success) {
      const bsimApiObj = await moddle.fromXML(response.response);

      const { processes, resources } = bsimApiObj && bsimApiObj.rootElement;

      const processSimu = processes && processes.process[0];
      const resourceData = resources && resources.resource;
      return simulationResult(processSimu, resourceData, "_" + sfx);
    } else {
      throw Error("No process returned");
    }
  } catch (e) {
    console.error(e);
  }
};
