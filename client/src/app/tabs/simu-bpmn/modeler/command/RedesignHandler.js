/**
 * A redesign handler that may be registered with the
 * {@link RedesignStack} via {@link RedesignStack#registerHandler}.
 */
export default function RedesignHandler() {}

/**
 * Execute changes described in the passed action context.
 *
 * @param {Object} context the execution context
 *
 * @return {Array<djs.model.Base>} list of touched (áka dirty) diagram elements
 */
RedesignHandler.prototype.execute = function (context) {};

/**
 * Revert changes described in the passed action context.
 *
 * @param {Object} context the execution context
 *
 * @return {Array<djs.model.Base>} list of touched (áka dirty) diagram elements
 */
RedesignHandler.prototype.revert = function (context) {};

/**
 * Return true if the handler may execute in the given context.
 *
 * @abstract
 *
 * @param {Object} context the execution context
 *
 * @return {boolean} true if executing in the context is possible
 */
RedesignHandler.prototype.canExecute = function (context) {
  return true;
};

/**
 * Execute actions before the actual redesign execution but
 * grouped together (for undo/redo) with the action.
 *
 * @param {Object} context the execution context
 */
RedesignHandler.prototype.preExecute = function (context) {};

/**
 * Execute actions after the actual redesign execution but
 * grouped together (for undo/redo) with the action.
 *
 * @param {Object} context the execution context
 */
RedesignHandler.prototype.postExecute = function (context) {};
