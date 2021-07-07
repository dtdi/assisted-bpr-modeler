/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { PureComponent } from "react";

import classNames from "classnames";

import { isFunction } from "min-dash";

import dragger from "../../../util/dom/dragger";

import css from "./RedesignContainer.less";

import { throttle } from "../../../util";

export const DEFAULT_LAYOUT = {
  open: true,
  width: 450,
};

export const MIN_WIDTH = 150;
export const MAX_WIDTH = 650;

/**
 * Container for redesign panel that can be resized and toggled.
 */
class RedesignContainerWrapped extends PureComponent {
  constructor(props) {
    super(props);

    this.handleResize = throttle(this.handleResize);

    this.ref = new React.createRef();

    this.context = {};
  }

  handleResizeStart = (event) => {
    const onDragStart = dragger(this.handleResize);

    onDragStart(event);

    const { open, width } = getLayoutFromProps(this.props);

    this.context = {
      open,
      startWidth: width,
    };
  };

  handleResize = (_, delta) => {
    const { x: dx } = delta;

    if (dx === 0) {
      return;
    }

    const { startWidth } = this.context;

    const { open, width } = getLayout(dx, startWidth);

    this.context = {
      ...this.context,
      open,
      width,
    };

    if (this.ref.current) {
      this.ref.current.classList.toggle("open", open);
      this.ref.current.style.width = `${open ? width : 0}px`;
    }
  };

  handleResizeEnd = () => {
    const { open, width } = this.context;

    this.context = {};

    this.changeLayout({
      redesignPanel: {
        open,
        width,
      },
    });
  };

  handleToggle = () => {
    const { layout } = this.props || {};

    const redesignPanel = layout.redesignPanel || DEFAULT_LAYOUT;

    this.changeLayout({
      redesignPanel: {
        ...redesignPanel,
        open: !redesignPanel.open,
      },
    });
  };

  changeLayout = (layout = {}) => {
    const { onLayoutChanged } = this.props;

    if (isFunction(onLayoutChanged)) {
      onLayoutChanged(layout);
    }
  };

  render() {
    const { className, forwardedRef } = this.props;

    const { open, width } = getLayoutFromProps(this.props);

    return (
      <div
        ref={this.ref}
        className={classNames(css.RedesignContainer, className, { open })}
        style={{ width }}
      >
        <div
          className="toggle"
          onClick={this.handleToggle}
          draggable
          onDragStart={this.handleResizeStart}
          onDragEnd={this.handleResizeEnd}
        >
          Redesign
        </div>
        {open && (
          <div
            className="resize-handle"
            draggable
            onDragStart={this.handleResizeStart}
            onDragEnd={this.handleResizeEnd}
          ></div>
        )}
        <div className="redesign-container" ref={forwardedRef}></div>
      </div>
    );
  }
}

export default React.forwardRef(function RedesignContainer(props, ref) {
  return <RedesignContainerWrapped {...props} forwardedRef={ref} />;
});

// helpers //////////

function getLayout(dx, initialWidth) {
  let width = Math.min(initialWidth - dx, MAX_WIDTH);

  const open = width >= MIN_WIDTH;

  if (!open) {
    width = DEFAULT_LAYOUT.width;
  }

  return {
    open,
    width,
  };
}

function getLayoutFromProps(props) {
  const layout = props.layout || {};

  const redesignPanel = layout.redesignPanel || DEFAULT_LAYOUT;

  const { open } = redesignPanel;

  const width = open ? redesignPanel.width : 0;

  return {
    open,
    width,
  };
}
