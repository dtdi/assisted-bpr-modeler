/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import debug from "debug";

import { PureComponent } from "react";

import Flags, {
  ET_ENDPOINT,
  DISABLE_REMOTE_INTERACTION,
} from "../../util/Flags";
import Metadata from "../../util/Metadata";

import eventHandlers from "./event-handlers";

const log = debug("UsageStatistics");

const PRIVACY_PREFERENCES_CONFIG_KEY = "editor.privacyPreferences";
const USAGE_STATISTICS_CONFIG_KEY = "ENABLE_USAGE_STATISTICS";
const EDITOR_ID_CONFIG_KEY = "editor.id";

const PRODUCT_MODELER = "aBPR Modeler";
const PRODUCT_EDITION_COMMUNITY = "Community";

const FETCH_METHOD = "POST";
const FETCH_HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
  "X-ABPR-APP": "true",
};

// ET endpoint is set to our CI provider as an env variable, passed to client via WebPack DefinePlugin
const DEFINED_ET_ENDPOINT = process.env.ET_ENDPOINT;

// In order to plug a new event handler:
//
// 1) Create a new event handler class under event-handlers
// 2) This class should extend BaseEventHandler
// 3) This class should use 'sendToET(data={})' super method to send a payload to ET
// 4) This class should be exported via index.js in order to be recognize by UsageStatistics plugin.
//
// See the example implementations: PingEventHandler, DiagramOpenEventHandler.

export default class UsageStatistics extends PureComponent {
  constructor(props) {
    super(props);

    // ET_ENDPOINT flag is useful for development.
    this.ET_ENDPOINT = Flags.get(ET_ENDPOINT) || DEFINED_ET_ENDPOINT;

    this._isEnabled = false;

    // registered event handlers
    this._eventHandlers = [];

    eventHandlers.forEach((eventHandlerConstructor) => {
      this._eventHandlers.push(
        new eventHandlerConstructor({
          onSend: this.sendRequest,
          subscribe: props.subscribe,
          config: props.config,
          getGlobal: props._getGlobal,
        })
      );
    });

    log("Amount of event handlers initialized: ", eventHandlers.length);
  }

  isEnabled = () => {
    return this._isEnabled;
  };

  enable = () => {
    log("Enabling");
    this._isEnabled = true;

    this._eventHandlers.forEach((eventHandler) => {
      eventHandler.enable();
    });
  };

  disable = () => {
    log("Disabling.");
    this._isEnabled = false;

    this._eventHandlers.forEach((eventHandler) => eventHandler.disable());
  };

  async setEditorId() {
    this._editorID = await this.props.config.get(EDITOR_ID_CONFIG_KEY);

    if (!this._editorID) {
      throw new Error("missing editor id");
    }
  }

  async componentDidMount() {
    // make sure we also set the editor although the plugin is not enabled
    await this.setEditorId();

    if (!this.ET_ENDPOINT) {
      return log("Not enabled: ET Endpoint not configured.");
    }

    if (Flags.get(DISABLE_REMOTE_INTERACTION)) {
      return log("Not enabled: Remote interaction disabled.");
    }

    // If remote interaction is not disabled via flags:
    // -> The user may turn on / off usage statistics on the run
    // -> The user may never actually restart the modeler.
    this.props.subscribe(
      "privacy-preferences.changed",
      this.handlePrivacyPreferencesChanged
    );

    const isUsageStatisticsEnabled = await this.isUsageStatisticsEnabled();

    if (!isUsageStatisticsEnabled) {
      return log(
        "Not enabled: Usage statistics are turned off via Privacy Preferences."
      );
    }

    this.enable();
  }

  async isUsageStatisticsEnabled() {
    const { config } = this.props;

    const privacyPreferences = await config.get(PRIVACY_PREFERENCES_CONFIG_KEY);

    return !!(
      privacyPreferences && privacyPreferences[USAGE_STATISTICS_CONFIG_KEY]
    );
  }

  handlePrivacyPreferencesChanged = async () => {
    const isUsageStatisticsEnabled = await this.isUsageStatisticsEnabled();

    if (isUsageStatisticsEnabled) {
      return this.enable();
    }

    return this.disable();
  };

  generatePayload = (data) => {
    return {
      installation: this._editorID,
      product: {
        name: PRODUCT_MODELER,
        version: Metadata.data.version,
        edition: PRODUCT_EDITION_COMMUNITY,
        internals: { ...data },
      },
    };
  };

  // We're setting this method because we want to be able to test this
  fetch = async (endpoint, payload) => {
    return fetch(endpoint, payload);
  };

  sendRequest = async (eventPayload) => {
    if (!this.isEnabled()) {
      return;
    }

    const etPayload = this.generatePayload(eventPayload);
    const endpoint = this.ET_ENDPOINT;

    try {
      log("Sending data to ET: ", eventPayload);

      const response = await this.fetch(endpoint, {
        method: FETCH_METHOD,
        headers: FETCH_HEADERS,
        body: JSON.stringify(etPayload),
      });

      log("ET response: ", response);

      return { status: response.status };
    } catch (err) {
      log("Error happened sending data to ET: ", err);

      return { error: err };
    }
  };

  render() {
    return null;
  }
}
