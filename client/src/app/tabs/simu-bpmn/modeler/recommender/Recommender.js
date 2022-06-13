import { map, forEach, isArray, groupBy } from "min-dash";
import { DivRstSet, Graph, div_dp } from "div-top-k";

import ParallelAdvice from "./idea/ParallelAdvice";
import SimpleIdeas from "./idea/SimpleIdeas";
import TriageGuidedAdvice from "./idea/TriageGuidedAdvice";
import TriageAdvice from "./idea/TriageAdvice";
import AutomationGuidedAdvice from "./idea/AutomationGuidedAdvice";
import Recommendation from "./idea/Recommendation";
import ExtraResourcesAdvice from "./idea/ExtraResourcesAdvice";
import AutomationAdvice from "./idea/AutomationAdvice";

const DEVILS_QUADRANGLE = [
  { title: "Cost", key: "cost" },
  { title: "Time", key: "time" },
  { title: "Flexibility", key: "flexibility" },
  { title: "Quality", key: "quality" },
];

export default class Recommender {
  $inject = [
    "eventBus",
    "translate",
    "editorActions",
    "injector",
    "redesignStack",
  ];

  focusDimension;
  _entries = [];
  _providerMap = [];

  constructor(eventBus, translate, editorActions, injector, redesignStack) {
    this._eventBus = eventBus;
    this._translate = translate;
    this._editorActions = editorActions;
    this._injector = injector;
    this._redesignStack = redesignStack;
    this.focusDimension = {};
    const self = this;

    self.baseSimulation = null;
    self.abortSignal = null;

    eventBus.on("element.click", (event) => {
      console.log(event.element);
    });

    eventBus.on("linting.completed", async (event) => {
      const { issues } = event;

      if (Object.keys(issues).length == 0) {
        //self._internalExecute()
        self.setFocusDimension({ dimension: DEVILS_QUADRANGLE[3] });
      }
    });

    eventBus.on("diagram.init", () => {
      self.registerProviders();
    });

    eventBus.on("redesignStack.finalized", (event) => {
      self._internalExecute();
    });
  }

  _internalExecute() {
    var self = this;
    self.mutes = [];
    forEach(self._providerMap, (item, key) => {
      if (item.execute) {
        item.execute(self.focusDimension);
      }
    });
  }

  registerProviders() {
    const self = this;
    const providers = {
      simple: SimpleIdeas,
      parallel_advice: ParallelAdvice,
      triage_guided: TriageGuidedAdvice,
      triage_advice: TriageAdvice,
      activityAutomation_guided: AutomationGuidedAdvice,
      activityAutomation: AutomationAdvice,
      extraResources_advice: ExtraResourcesAdvice,
    };
    forEach(providers, function (handler, id) {
      self.registerProvider(id, handler);
    });
  }

  /**
   * Register a provider instance with the recommender stack
   *
   * @param {string} heuristic
   * @param {recommendationProvider} provider
   */
  register(heuristic, provider) {
    this._setProvider(heuristic, provider);
  }

  /**
   * Register a provider type with the heuristic stack
   * by instantiating it and injecting its dependencies.
   *
   * @param {string} heuristic
   * @param {Function} a constructor for a {@link recommendationProvider}
   */
  registerProvider(heuristic, providerCls) {
    if (!heuristic || !providerCls) {
      throw new Error("heuristic and providerCls must be defined");
    }

    var provider = this._injector.instantiate(providerCls);
    this.register(heuristic, provider);
  }

  _getProvider(heuristic) {
    return this._providerMap[heuristic];
  }

  _setProvider(heuristic, provider) {
    if (!heuristic || !provider) {
      throw new Error("heuristic and provider required");
    }

    if (this._providerMap[heuristic]) {
      throw new Error("overriding provider for heuristic <" + heuristic + ">");
    }

    this._providerMap[heuristic] = provider;
  }

  refresh() {
    this._internalExecute();
  }

  setFocusDimension(context) {
    const { dimension } = context;
    if (dimension === this.focusDimension) {
      return;
    }
    this.focusDimension = dimension;
    this._entries = [];
    this._eventBus.fire("redesign.dimension.changed", { dimension });
    this._internalExecute();
  }

  getFocusDimensions() {
    return map(DEVILS_QUADRANGLE, (dim) => {
      if (dim.title === this.focusDimension.title) {
        dim.active = true;
      }
      return dim;
    });
  }

  /**
   *
   * @param {*} newEntries Entries to add to the list - equal entries will be deleted
   * @param {*} mutes
   */
  pushIdeas(newEntries, mutes) {
    if (!isArray(newEntries)) newEntries = [newEntries];

    this.mutes.push(...new Set(mutes || []));

    const newKeys = newEntries.map((e) => e.key);

    let entries = this._entries.filter((entry) => {
      return !this.mutes.includes(entry.key) && !newKeys.includes(entry.key);
    });

    this._entries = [...entries, ...newEntries];
    this._setEntries();
  }

  removeIdeas(ideasToRemove) {
    if (!isArray(ideasToRemove)) ideasToRemove = [ideasToRemove];
    const delPatterns = ideasToRemove
      .filter((idea) => idea.isLoading)
      .map((e) => e.key);
    const delIdeas = ideasToRemove.filter((idea) => !idea.isLoading);

    let entries = this._entries.filter((entry) => {
      return !delPatterns.includes(entry.key) && !delIdeas.includes(entry);
    });

    this._entries = entries;
    this._setEntries();
  }

  _rebuild() {
    var providers = this._getProviders();
    if (!providers.length) {
      return;
    }

    /** 
    if (!this._container) {
      this._init();
    }
  
    this._update();
    */
  }

  _init() {}

  _setEntries() {
    let topIdeas = this._entries.filter((idea) =>
      [Recommendation.TYPE_ADVICE, Recommendation.TYPE_GUIDED_ADVICE].includes(
        idea.ideaType
      )
    );
    let furtherIdeas = this._entries.filter(
      (idea) =>
        ![
          Recommendation.TYPE_ADVICE,
          Recommendation.TYPE_GUIDED_ADVICE,
        ].includes(idea.ideaType)
    );

    let maxKSet = this._getDivTop(topIdeas, 5);

    topIdeas.forEach((elem, idx) => {
      const maxKIndex = maxKSet.indexOf(idx);
      elem.groupRank = maxKIndex;
      if (maxKIndex !== -1) {
        elem.group = "topadvice";
      } else {
        elem.group = "other";
      }
      return elem;
    });

    maxKSet = this._getDivTop(furtherIdeas, 5);
    furtherIdeas.forEach((elem, idx) => {
      const maxKIndex = maxKSet.indexOf(idx);
      elem.groupRank = maxKIndex;
      if (maxKIndex !== -1) {
        elem.group = "furthertop";
      } else {
        elem.group = "other";
      }
      return elem;
    });

    const allEntries = [...topIdeas, ...furtherIdeas];

    this._eventBus.fire("redesign.recs.changed", { ideas: allEntries });
  }

  _getDivTop(entries, k) {
    const vertices = [];
    const eTable = [];

    const TRESHOLD = 0.2;

    for (let i = 0; i < entries.length; i++) {
      eTable[i] = [];
      vertices.push([i, entries[i].relevance]);
      for (let j = 0; j < i; j++) {
        if (entries[i].sim(entries[j]) > TRESHOLD) {
          eTable[i].push(j);
          eTable[j].push(i);
        }
      }
    }
    const graph = new Graph(vertices, eTable);

    /** @type {DivRstSet} */
    const resultSet = div_dp(graph, k);

    let maxKSet;
    if (resultSet.hasK(k)) {
      maxKSet = resultSet.getMaxKSet(k);
    } else maxKSet = [...Array(entries.length).keys()];

    return maxKSet;
  }
}

// helpers ////////////////////
