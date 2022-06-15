import { uniqueBy, isArray } from "min-dash";
import Idea from "../recommender/Idea";

/**
 * A service that offers undoable execution of redesigns.
 *
 * The redesign stack is responsible for executing modeling actions
 * in a undoable manner. To do this it delegates the actual
 * redesign execution to {@link redesignHandler}s.
 *
 * redesign handlers provide {@link redesignHandler#execute(ctx)} and
 * {@link redesignHandler#revert(ctx)} methods to undo a redesign
 * identified by a redesign context.
 *
 *
 * ## Life-Cycle events
 *
 * In the process the redesign stack fires a number of life-cycle events
 * that other components to participate in the redesign execution.
 *
 *    * preExecute
 *    * preExecuted
 *    * execute
 *    * executed
 *    * postExecute
 *    * postExecuted
 *    * revert
 *    * reverted
 *
 * A special event is used for validating, whether a redesign can be
 * performed prior to its execution.
 *
 *    * canExecute
 *
 * Each of the events is fired as `redesignStack.{eventName}` and
 * `redesignStack.{redesignName}.{eventName}`, respectively. This gives
 * components fine grained control on where to hook into.
 *
 * The event object fired transports `redesign`, the name of the
 * redesign and `context`, the redesign context.
 *
 *
 * ## Creating redesign Handlers
 *
 * redesign handlers should provide the {@link redesignHandler#execute(ctx)}
 * and {@link redesignHandler#revert(ctx)} methods to implement
 * undoing of a redesign.
 *
 * A redesign handler _must_ ensure undo is performed properly in order
 * not to break the undo chain. It must also return the shapes that
 * got changed during the `execute` and `revert` operations.
 *
 * redesign handlers may execute other modeling operations (and thus
 * redesigns) in their `preExecute` and `postExecute` phases. The redesign
 * stack will properly group all redesigns together into a logical unit
 * that may be re- and undone atomically.
 *
 * redesign handlers must not execute other redesigns from within their
 * core implementation (`execute`, `revert`).
 *
 *
 * ## Change Tracking
 *
 * During the execution of the RedesignStack it will keep track of all
 * elements that have been touched during the redesign's execution.
 *
 * At the end of the RedesignStack execution it will notify interested
 * components via an 'elements.changed' event with all the dirty
 * elements.
 *
 * The event can be picked up by components that are interested in the fact
 * that elements have been changed. One use case for this is updating
 * their graphical representation after moving / resizing or deletion.
 *
 * @see redesignHandler
 *
 * @param {EventBus} eventBus
 * @param {Injector} injector
 */
export default function RedesignStack(eventBus, injector, editorActions) {
  /**
   * A map of all registered redesign handlers.
   *
   * @type {Object}
   */
  this._handlerMap = {};

  /**
   * A stack containing all re/undoable actions on the diagram
   *
   * @type {Array<Object>}
   */
  this._stack = [];

  /**
   * The current index on the stack
   *
   * @type {number}
   */
  this._stackIdx = -1;

  /**
   * Current active RedesignStack execution
   *
   * @type {Object}
   */
  this._currentExecution = {
    actions: [],
    dirty: [],
  };

  this._injector = injector;
  this._eventBus = eventBus;
  this._editorActions = editorActions;

  this._uid = 1;

  const self = this;
  eventBus.on(
    ["diagram.destroy", "diagram.clear"],
    function () {
      this.clear(false);
    },
    this
  );
  self._registerEditorActions();
}

RedesignStack.prototype._registerEditorActions = function () {
  const self = this;
  var actions = {
    "start-empty": function (opts) {
      let context = opts;
      if (!opts) {
        const idea = new Idea("DT-0", 0);
        idea.name = "Manual Redesign";
        idea.bestPracticeClass = "other";
        context = {
          idea: idea,
        };
      }
      self.initialize("idea.simple", context);
    },

    "base-simulation": (opts) => {
      let context = opts || {};
      context.restart = true;
      self.evaluate("idea.base", context);
    },

    stash: (opts) => {
      self.stash(opts);
    },

    next: (opts) => {
      self.next(opts);
    },

    commit: (opts) => {
      let context = opts || {};
      self.commit(context);
    },

    revert: (opts) => {
      let context = opts || {};
      self.revert(context);
    },

    finalize: (opts) => {
      let context = opts || {};
      self.finalize(context);
    },

    "commit-finalize": (opts) => {
      let context = opts || {};
      self.commit(context);
      self.finalize(context);
    },
  };
  this._editorActions.register(actions);
};

RedesignStack.$inject = ["eventBus", "injector", "editorActions"];

/**
 * evaluate a redesign Execution
 *
 * @param {string} redesign the redesign to evaluate
 * @param {Object} context the environment to evaluate the redesign in
 */
RedesignStack.prototype.evaluate = function (redesign, context) {
  const self = this;
  if (!redesign) {
    throw new Error("redesign required");
  }

  var handler = this._getHandler(redesign);

  if (!handler) {
    throw new Error("no redesign handler registered for <" + redesign + ">");
  }

  if (handler.evaluate) {
    self._fire(redesign, "evaluation-started", {});

    return  handler.evaluate(context)
      .then((context) => {
        var action = { redesign: redesign, context: context };
        self._fire(redesign, "evaluated", action);
        return context;
      })
      .catch((err) => {
        var action = { redesign: redesign, context: context, error: err };
        self._fire(redesign, "evaluation-failed", action);
      });

  }
};

/**
 * Initialize a redesign Execution
 *
 * @param {string} redesign the redesign to execute
 * @param {Object} context the environment to execute the redesign in
 */
RedesignStack.prototype.initialize = function (redesign, context) {
  if (!redesign) {
    throw new Error("redesign required");
  }

  var action = { redesign: redesign, context: context };

  this._pushAction(action);

  var handler = this._getHandler(redesign);

  if (!handler) {
    throw new Error("no redesign handler registered for <" + redesign + ">");
  }

  this._fire(redesign, "initialize", action);

  if (handler.initialize) {
    handler.initialize(context);
    context.status = "initialized";
  }

  this._fire(redesign, "initialized", action);
};

/**
 * Continue a redesign execution
 *
 * @param {Object} newContext the environment to execute the redesign in
 */
RedesignStack.prototype.next = function (newContext) {
  const self = this;
  const execution = this._getCurrentExecution();
  var actions = execution.actions;

  var baseAction = actions[0],
    context = baseAction.context,
    redesign = baseAction.redesign;

  var handler = this._getHandler(redesign);

  if (!handler) {
    throw new Error("no redesign handler registered for <" + redesign + ">");
  }

  if (execution.atomic) {
    throw new Error(
      "illegal invocation in <execute> or <revert> phase (action: " +
        action.redesign +
        ")"
    );
  }

  // guard against illegal nested redesign stack invocations
  this._atomicDo(function () {
    self._fire(redesign, "execute", baseAction);

    if (handler.execute) {
      // actual execute + mark return results as dirty
      self._markDirty(handler.execute(context, newContext));
    }

    // log to stack
    //self._executedAction(baseAction);
    context.status = "executed";

    self._fire(redesign, "executed", baseAction);
  });
};

/**
 * Stash a ongoing a redesign execution
 *
 * @param {Object} newContext the environment to execute the redesign in
 */
RedesignStack.prototype.stash = function (newContext) {
  const self = this;
  const execution = this._getCurrentExecution();
  var actions = execution.actions;

  var baseAction = actions[0],
    context = baseAction.context,
    redesign = baseAction.redesign;

  var handler = this._getHandler(redesign);

  if (!handler) {
    throw new Error("no redesign handler registered for <" + redesign + ">");
  }

  if (execution.atomic) {
    throw new Error(
      "illegal invocation in <execute> or <revert> phase (action: " +
        action.redesign +
        ")"
    );
  }

  // guard against illegal nested redesign stack invocations
  this._atomicDo(function () {
    self._fire(redesign, "stash", baseAction);

    if (handler.stash) {
      // actual execute + mark return results as dirty
      self._markDirty(handler.stash(context, newContext));
    }
    context.status = "stashed";

    // remove action
    self._popAction();

    self._fire(redesign, "stashed", baseAction);
  });
};

/**
 * Continue a redesign execution
 *
 * @param {Object} newContext the environment to execute the redesign in
 */
RedesignStack.prototype.commit = async function (newContext) {
  const self = this;
  const execution = this._getCurrentExecution();
  var actions = execution.actions;

  var baseAction = actions[0],
    context = baseAction.context,
    redesign = baseAction.redesign;

  var handler = this._getHandler(redesign);

  if (!handler) {
    throw new Error("no redesign handler registered for <" + redesign + ">");
  }

  if (execution.atomic) {
    throw new Error(
      "illegal invocation in <execute> or <revert> phase (action: " +
        action.redesign +
        ")"
    );
  }

  // guard against illegal nested redesign stack invocations
  this._atomicDo(async function () {
    self._fire(redesign, "commit", baseAction);

    if (handler.commit) {
      // actual execute + mark return results as dirty
      self._markDirty(await handler.commit(context, newContext));
    }

    // log to stack
    //self._executedAction(baseAction);

    context.status = "committed";
    self._fire(redesign, "committed", baseAction);
  });
};

/**
 * Finalize a redesign execution
 *
 * @param {Object} newContext the environment to execute the redesign in
 */
RedesignStack.prototype.finalize = function (newContext) {
  const execution = this._getCurrentExecution();
  var actions = execution.actions;

  var baseAction = actions[0],
    context = baseAction.context,
    redesign = baseAction.redesign;

  var handler = this._getHandler(redesign);

  if (!handler) {
    throw new Error("no redesign handler registered for <" + redesign + ">");
  }

  if (execution.atomic) {
    throw new Error(
      "illegal invocation in <execute> or <revert> phase (action: " +
        action.redesign +
        ")"
    );
  }

  this._fire(redesign, "finalize", baseAction);

  if (handler.finalize) {
    handler.finalize(context, newContext);
  }

  context.status = "finalized";
  this._fire(redesign, "finalized", baseAction);
  this._executedAction(baseAction);
  this._popAction(baseAction);
};

/**
 * Ask whether a given redesign can be executed.
 *
 * Implementors may hook into the mechanism on two ways:
 *
 *   * in event listeners:
 *
 *     Users may prevent the execution via an event listener.
 *     It must prevent the default action for `redesignStack.(<redesign>.)canExecute` events.
 *
 *   * in redesign handlers:
 *
 *     If the method {@link redesignHandler#canExecute} is implemented in a handler
 *     it will be called to figure out whether the execution is allowed.
 *
 * @param  {string} redesign the redesign to execute
 * @param  {Object} context the environment to execute the redesign in
 *
 * @return {boolean} true if the redesign can be executed
 */
RedesignStack.prototype.canExecute = function (redesign, context) {
  var action = { redesign: redesign, context: context };

  var handler = this._getHandler(redesign);

  var result = this._fire(redesign, "canExecute", action);

  // handler#canExecute will only be called if no listener
  // decided on a result already
  if (result === undefined) {
    if (!handler) {
      return false;
    }

    if (handler.canExecute) {
      result = handler.canExecute(context);
    }
  }

  return result;
};

/**
 * Clear the redesign stack, erasing all undo history
 */
RedesignStack.prototype.clear = function (emit) {
  this._stack.length = 0;
  this._stackIdx = -1;

  if (emit !== false) {
    this._fire("changed");
  }
};

/**
 * Undo last redesign(s)
 */
RedesignStack.prototype.undo = function () {
  var action = this._getUndoAction(),
    next;

  if (action) {
    this._pushAction(action);

    while (action) {
      this._internalUndo(action);
      next = this._getUndoAction();

      if (!next || next.id !== action.id) {
        break;
      }

      action = next;
    }

    this._popAction();
  }
};

/**
 * Register a handler instance with the redesign stack
 *
 * @param {string} redesign
 * @param {redesignHandler} handler
 */
RedesignStack.prototype.register = function (redesign, handler) {
  this._setHandler(redesign, handler);
};

/**
 * Register a handler type with the redesign stack
 * by instantiating it and injecting its dependencies.
 *
 * @param {string} redesign
 * @param {Function} a constructor for a {@link redesignHandler}
 */
RedesignStack.prototype.registerHandler = function (redesign, handlerCls) {
  if (!redesign || !handlerCls) {
    throw new Error("redesign and handlerCls must be defined");
  }

  var handler = this._injector.instantiate(handlerCls);
  this.register(redesign, handler);
};

RedesignStack.prototype.canUndo = function () {
  return !!this._getUndoAction();
};

RedesignStack.prototype.canRedo = function () {
  return !!this._getRedoAction();
};

// stack access  //////////////////////

RedesignStack.prototype._getRedoAction = function () {
  return this._stack[this._stackIdx + 1];
};

RedesignStack.prototype._getUndoAction = function () {
  return this._stack[this._stackIdx];
};

// internal functionality //////////////////////

RedesignStack.prototype._internalUndo = function (action) {
  var self = this;

  var redesign = action.redesign,
    context = action.context;

  var handler = this._getHandler(redesign);

  // guard against illegal nested redesign stack invocations
  this._atomicDo(function () {
    self._fire(redesign, "revert", action);

    if (handler.revert) {
      self._markDirty(handler.revert(context));
    }

    self._revertedAction(action);

    self._fire(redesign, "reverted", action);
  });
};

RedesignStack.prototype._fire = function (redesign, qualifier, event) {
  if (arguments.length < 3) {
    event = qualifier;
    qualifier = null;
  }

  var names = qualifier ? [redesign + "." + qualifier, qualifier] : [redesign],
    i,
    name,
    result;

  event = this._eventBus.createEvent(event);
  for (i = 0; (name = names[i]); i++) {
    result = this._eventBus.fire("redesignStack." + name, event);
    if (event.cancelBubble) {
      break;
    }
  }

  return result;
};

RedesignStack.prototype._createId = function () {
  return this._uid++;
};

RedesignStack.prototype._atomicDo = function (fn) {
  var execution = this._currentExecution;

  execution.atomic = true;

  try {
    fn();
  } finally {
    execution.atomic = false;
  }
};

/**
 * dont need.
 * @param {dont} action
 */
RedesignStack.prototype._internalExecute = function (action) {
  var self = this;

  var redesign = action.redesign,
    context = action.context;

  var handler = this._getHandler(redesign);

  if (!handler) {
    throw new Error("no redesign handler registered for <" + redesign + ">");
  }

  this._pushAction(action);

  this._fire(redesign, "preExecute", action);

  if (handler.preExecute) {
    handler.preExecute(context);
  }

  this._fire(redesign, "preExecuted", action);

  // guard against illegal nested redesign stack invocations
  this._atomicDo(function () {
    self._fire(redesign, "execute", action);

    if (handler.execute) {
      // actual execute + mark return results as dirty
      self._markDirty(handler.execute(context));
    }

    // log to stack
    //self._executedAction(action);

    self._fire(redesign, "executed", action);
  });

  this._fire(redesign, "postExecute", action);

  if (handler.postExecute) {
    handler.postExecute(context);
  }

  this._fire(redesign, "postExecuted", action);

  this._popAction(action);
};

RedesignStack.prototype._getCurrentExecution = function () {
  var execution = this._currentExecution;
  if (!execution) {
    throw new Error("no current execution (action)");
  }
  return execution;
};

RedesignStack.prototype._pushAction = function (action) {
  var execution = this._currentExecution,
    actions = execution.actions;

  var baseAction = actions[0];

  if (execution.atomic) {
    throw new Error(
      "illegal invocation in <execute> or <revert> phase (action: " +
        action.redesign +
        ")"
    );
  }

  if (!action.id) {
    action.id = (baseAction && baseAction.id) || this._createId();
  }

  actions.push(action);
};

RedesignStack.prototype._popAction = function () {
  var execution = this._currentExecution,
    actions = execution.actions,
    dirty = execution.dirty;

  actions.pop();

  if (!actions.length) {
    this._eventBus.fire("elements.changed", {
      elements: uniqueBy("id", dirty.reverse()),
    });

    dirty.length = 0;

    this._fire("changed");
  }
};

RedesignStack.prototype._markDirty = function (elements) {
  var execution = this._currentExecution;

  if (!elements) {
    return;
  }

  elements = isArray(elements) ? elements : [elements];

  execution.dirty = execution.dirty.concat(elements);
};

RedesignStack.prototype._executedAction = function (action) {
  var stackIdx = ++this._stackIdx;

  this._stack.splice(stackIdx, this._stack.length, action);
};

RedesignStack.prototype._revertedAction = function (action) {
  this._stackIdx--;
};

RedesignStack.prototype._getHandler = function (redesign) {
  return this._handlerMap[redesign];
};

RedesignStack.prototype._setHandler = function (redesign, handler) {
  if (!redesign || !handler) {
    throw new Error("redesign and handler required");
  }

  if (this._handlerMap[redesign]) {
    throw new Error("overriding handler for redesign <" + redesign + ">");
  }

  this._handlerMap[redesign] = handler;
};
