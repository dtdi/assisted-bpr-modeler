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

import SimulatePlugin from "./simulate-plugin";

import { forEach, omit } from "min-dash";

/**
 * A parent plugin for these two Simu plugins:
 * a) SimulatePlugin
 */
export default class SimuPlugin extends PureComponent {
  constructor(props) {
    super(props);

    this.subscriptions = {};
  }

  subscribeToMessaging = (pluginName, callback) => {
    this.subscriptions[pluginName] = callback;
  };

  unsubscribeFromMessaging = (pluginName) => {
    this.subscriptions = omit(this.subscriptions, pluginName);
  };

  broadcastMessage = (message, body) => {
    forEach(this.subscriptions, (callback) => {
      callback(message, body);
    });
  };

  render() {
    return (
      <React.Fragment>
        <SimulatePlugin
          {...this.props}
          subscribeToMessaging={this.subscribeToMessaging}
          broadcastMessage={this.broadcastMessage}
          unsubscribeFromMessaging={this.unsubscribeFromMessaging}
        />
      </React.Fragment>
    );
  }
}
