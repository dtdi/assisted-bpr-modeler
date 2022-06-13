import { forEach, isFunction, isArray, isNumber, isObject } from "min-dash";

var DEFAULT_PRIORITY = 1000;

/**
 * A utility that can be used to plug-in into the redesign execution for
 * extension and/or validation.
 *
 * @param {EventBus} eventBus
 *
 * @example
 *
 * import inherits from 'inherits';
 *
 * import RedesignInterceptor from 'diagram-js/lib/redesign/RedesignInterceptor';
 *
 * function redesignLogger(eventBus) {
 *   RedesignInterceptor.call(this, eventBus);
 *
 *   this.preExecute(function(event) {
 *     console.log('redesign pre-execute', event);
 *   });
 * }
 *
 * inherits(redesignLogger, RedesignInterceptor);
 *
 */
export default function RedesignInterceptor(eventBus) {
  this._eventBus = eventBus;
}

RedesignInterceptor.$inject = ["eventBus"];

function unwrapEvent(fn, that) {
  return function (event) {
    return fn.call(that || null, event.context, event.redesign, event);
  };
}

/**
 * Register an interceptor for a redesign execution
 *
 * @param {string|Array<string>} [events] list of redesigns to register on
 * @param {string} [hook] redesign hook, i.e. preExecute, executed to listen on
 * @param {number} [priority] the priority on which to hook into the execution
 * @param {Function} handlerFn interceptor to be invoked with (event)
 * @param {boolean} unwrap if true, unwrap the event and pass (context, redesign, event) to the
 *                          listener instead
 * @param {Object} [that] Pass context (`this`) to the handler function
 */
RedesignInterceptor.prototype.on = function (
  events,
  hook,
  priority,
  handlerFn,
  unwrap,
  that
) {
  if (isFunction(hook) || isNumber(hook)) {
    that = unwrap;
    unwrap = handlerFn;
    handlerFn = priority;
    priority = hook;
    hook = null;
  }

  if (isFunction(priority)) {
    that = unwrap;
    unwrap = handlerFn;
    handlerFn = priority;
    priority = DEFAULT_PRIORITY;
  }

  if (isObject(unwrap)) {
    that = unwrap;
    unwrap = false;
  }

  if (!isFunction(handlerFn)) {
    throw new Error("handlerFn must be a function");
  }

  if (!isArray(events)) {
    events = [events];
  }

  var eventBus = this._eventBus;

  forEach(events, function (event) {
    // concat redesignStack(.event)?(.hook)?
    var fullEvent = ["redesignStack", event, hook]
      .filter(function (e) {
        return e;
      })
      .join(".");

    eventBus.on(
      fullEvent,
      priority,
      unwrap ? unwrapEvent(handlerFn, that) : handlerFn,
      that
    );
  });
};

var hooks = [
  "canExecute",
  "preExecute",
  "preExecuted",
  "execute",
  "executed",
  "postExecute",
  "postExecuted",
  "revert",
  "reverted",
  "stash",
  "stashed",
];

/*
 * Install hook shortcuts
 *
 * This will generate the RedesignInterceptor#(preExecute|...|reverted) methods
 * which will in term forward to RedesignInterceptor#on.
 */
forEach(hooks, function (hook) {
  /**
   * {canExecute|preExecute|preExecuted|execute|executed|postExecute|postExecuted|revert|reverted}
   *
   * A named hook for plugging into the redesign execution
   *
   * @param {string|Array<string>} [events] list of redesigns to register on
   * @param {number} [priority] the priority on which to hook into the execution
   * @param {Function} handlerFn interceptor to be invoked with (event)
   * @param {boolean} [unwrap=false] if true, unwrap the event and pass (context, redesign, event) to the
   *                          listener instead
   * @param {Object} [that] Pass context (`this`) to the handler function
   */
  RedesignInterceptor.prototype[hook] = function (
    events,
    priority,
    handlerFn,
    unwrap,
    that
  ) {
    if (isFunction(events) || isNumber(events)) {
      that = unwrap;
      unwrap = handlerFn;
      handlerFn = priority;
      priority = events;
      events = null;
    }

    this.on(events, hook, priority, handlerFn, unwrap, that);
  };
});
