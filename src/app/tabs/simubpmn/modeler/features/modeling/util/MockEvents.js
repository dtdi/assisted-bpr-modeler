import { assign } from "min-dash";

/**
 * Create an event with global coordinates
 * computed based on the loaded diagrams canvas position and the
 * specified canvas local coordinates.
 *
 * @param {Point} point of the event local the canvas (closure)
 * @param {Object} data
 *
 * @return {Event} event, scoped to the given canvas
 */
export function createCanvasEvent(canvas, eventBus, position, data) {
  var target = canvas._svg;

  var clientRect = canvas._container.getBoundingClientRect();

  var absolutePosition = {
    x: position.x + clientRect.left,
    y: position.y + clientRect.top,
  };

  return createEvent(eventBus, target, absolutePosition, data);
}

export function createEvent(eventBus, target, position, data) {
  data = assign(
    {
      target: target,
      clientX: position.x,
      clientY: position.y,
      offsetX: position.x,
      offsetY: position.y,
      button: 0,
    },
    data || {}
  );

  return eventBus.createEvent(data);
}
