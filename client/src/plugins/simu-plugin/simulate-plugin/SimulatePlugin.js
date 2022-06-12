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

import { omit } from "min-dash";

import pDefer from "p-defer";

import classNames from "classnames";

import { Fill } from "../../../app/slot-fill";

import DeployIcon from "icons/Deploy.svg";

import { generateId } from "../../../util";

import { AUTH_TYPES } from "../shared/ZeebeAuthTypes";

import { CAMUNDA_CLOUD } from "../shared/ZeebeTargetTypes";

import SimulatePluginOverlay from "./SimulatePluginOverlay";

import { ENGINES } from "../../../util/Engines";

import css from "./SimulatePlugin.less";

const DEPLOYMENT_CONFIG_KEY = "zeebe-simulate-tool";

const ZEEBE_ENDPOINTS_CONFIG_KEY = "zeebeEndpoints";

const GRPC_ERROR_CODES = {
  0: "OK",
  1: "CANCELLED",
  2: "UNKNOWN",
  3: "INVALID_ARGUMENT",
  4: "DEADLINE_EXCEEDED",
  5: "NOT_FOUND",
  6: "ALREADY_EXISTS",
  7: "PERMISSION_DENIED",
  8: "RESOURCE_EXHAUSTED",
  9: "FAILED_PRECONDITION",
  10: "ABORTED",
  11: "OUT_OF_RANGE",
  12: "UNIMPLEMENTED",
  13: "INTERNAL",
  14: "UNAVAILABLE",
  15: "DATA_LOSS",
  16: "UNAUTHENTICATED",
};

export default class SimulatePlugin extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      activeTab: null,
      overlayState: null,
    };
    this._anchorRef = React.createRef();
  }

  componentDidMount() {
    this.props.subscribe("app.activeTabChanged", ({ activeTab }) => {
      this.setState({
        activeTab,
        overlayState: null,
      });
    });

    this.props.subscribeToMessaging("simulatePlugin", this.onMessageReceived);
  }

  componentWillUnmount() {
    this.props.unsubscribeFromMessaging("simulatePlugin");
  }

  async simulate(options = {}) {
    const { activeTab: tab } = this.state;

    /**
     * Notify interested parties via optional callback.
     *
     * @param {object} result
     * @param {object|null} result.simulateResult - null for cancellation
     * @param {object} [result.endpoint]
     */

    // (1) get simulate config
    const simulateConfig = await this.getSimulateConfig(tab, options);

    if (!simulateConfig) {
      return;
    }

    // (3) simulate
    await this.simulateWithConfig(options, simulateConfig);
  }

  notifyResult(result, options) {
    const { done } = options;

    return done && done(result);
  }

  async getSimulateConfig(tab, options) {
    // (1) save tab
    const savedTab = await this.saveTab(tab);

    // cancel action if save was cancelled
    if (!savedTab) {
      this.notifyResult(null, options);
      return;
    }

    // (2) retrieve saved config
    let config = await this.getSavedConfig(tab);

    const endpoint = await this.getDefaultEndpoint(tab);

    config = {
      ...config,
      endpoint,
    };

    // (2.1) open overlay if config is incomplete
    const canSimulate = await this.canSimulateWithConfig(config, options);

    if (!canSimulate) {
      config = await this.getConfigFromUser({}, savedTab, options);

      // user canceled
      if (!config) {
        this.notifyResult(null, options);
        return;
      }
    } else {
      // no more input needed for start instance
      if (options.isStart) {
        options.onClose();
      }
    }

    if (options.notifyResult) {
      this.notifyResult({ config, savedTab }, options);
    }

    config = await this.saveConfig(savedTab, config);

    return { savedTab, config };
  }

  async simulateWithConfig(options, simulateConfig) {
    const { savedTab, config } = simulateConfig;

    const simulateResult = await this.simulateTab(savedTab, config);

    // (4) include version simulateed to as contextual information
    //options.gatewayVersion = await this.getGatewayVersion(config);

    // (5) notify interested parties
    this.notifyResult(
      {
        simulateResult,
        endpoint: config.endpoint,
      },
      options
    );

    console.log(simulateResult);

    const { response, success } = simulateResult;

    // (6) Handle success or error
    if (!success) {
      this.onSimulateError(response, simulateConfig, options);
    } else {
      this.onSimulateSuccess(response, simulateConfig, options);
    }
  }

  simulateTab(tab, config) {
    const {
      file: { path, contents },
    } = tab;
    const {
      simulate: { name },
      endpoint,
    } = config;

    const simuAPI = this.props._getGlobal("simuAPI");
    console.log(tab);

    return simuAPI.simulate({
      filePath: path,
      fileContents: contents,
      name,
      endpoint,
    });
  }

  abortSimulation(tab, config) {
    const simuAPI = this.props._getGlobal("simuAPI");
    console.log(tab);

    return simuAPI.abort({});
  }

  async getGatewayVersion(config) {
    const { endpoint } = config;

    const simuAPI = this.props._getGlobal("simuAPI");

    const getGatewayVersionResult = await simuAPI.getGatewayVersion(endpoint);

    const { gatewayVersion } = getGatewayVersionResult.response;

    return gatewayVersion;
  }

  saveTab(tab) {
    return this.props.triggerAction("save", { tab });
  }

  async canSimulateWithConfig(config, options) {
    const { isStart } = options;

    if (!isStart) {
      return false;
    }

    // return early for missing essential parts
    if (!config.simulate || !config.endpoint) {
      return false;
    }

    const { connectionResult } = await this.connectionChecker.check(
      config.endpoint
    );

    return connectionResult && connectionResult.success;
  }

  async getConfigFromUser(savedConfig, tab, options = {}) {
    const p = pDefer();

    const onClose = (config, userAction) => {
      if (options.onClose) {
        options.onClose();
      }

      this.closeOverlay();

      if (userAction === "cancel") {
        this.saveConfig(tab, config);
        return p.resolve(null);
      }

      return p.resolve(config);
    };

    const defaultConfiguration = await this.getDefaultConfig(savedConfig, tab);

    const overlayState = {
      config: defaultConfiguration,
      isStart: !!options.isStart,
      onClose,
      anchorRef: options.anchorRef || this._anchorRef,
    };

    // open overlay
    this.setState({
      overlayState,
    });

    return p.promise;
  }

  onMessageReceived = async (msg, body) => {
    if (msg === "simulateWithConfig") {
      const { simulateConfig } = body;
      this.simulateWithConfig(body, simulateConfig);
    }

    if (msg === "getSimulateConfig") {
      this.getSimulateConfig(this.state.activeTab, body);
    }

    if (msg === "cancel") {
      const { overlayState } = this.state;

      if (overlayState) {
        this.state.overlayState.onClose(null);
      }
    }
  };

  async saveConfig(tab, config) {
    const { endpoint, simulate } = config;

    const endpointToSave = endpoint.rememberCredentials
      ? endpoint
      : withoutCredentials(endpoint);

    await this.saveEndpoint(endpointToSave);

    const tabConfiguration = {
      simulate,
      endpointId: endpointToSave.id,
    };

    await this.setTabConfiguration(tab, tabConfiguration);

    return config;
  }

  async getSavedConfig(tab) {
    const tabConfig = await this.getTabConfiguration(tab);

    if (!tabConfig) {
      return {};
    }

    const { simulate } = tabConfig;

    return {
      simulate,
    };
  }

  async getDefaultEndpoint(tab) {
    let endpoint = {
      id: generateId(),
      targetType: CAMUNDA_CLOUD,
      authType: AUTH_TYPES.NONE,
      contactPoint: "",
      oauthURL: "",
      audience: "",
      clientId: "",
      clientSecret: "",
      camundaCloudClientId: "",
      camundaCloudClientSecret: "",
      camundaCloudClusterUrl: "",
      rememberCredentials: false,
    };

    const previousEndpoints = await this.getEndpoints();
    if (previousEndpoints.length) {
      endpoint = previousEndpoints[0];
    }

    return endpoint;
  }

  async getDefaultConfig(savedConfig, tab) {
    const simulate = {
      name: withoutExtension(tab.name),
    };

    const endpoint = await this.getDefaultEndpoint(tab);

    return {
      simulate: {
        ...simulate,
        ...savedConfig.simulate,
      },
      endpoint,
    };
  }

  async saveEndpoint(endpoint) {
    const existingEndpoints = await this.getEndpoints();

    const updatedEndpoints = addOrUpdateById(existingEndpoints, endpoint);

    await this.setEndpoints(updatedEndpoints);

    return endpoint;
  }

  getEndpoints() {
    return this.props.config.get(ZEEBE_ENDPOINTS_CONFIG_KEY, []);
  }

  setEndpoints(endpoints) {
    return this.props.config.set(ZEEBE_ENDPOINTS_CONFIG_KEY, endpoints);
  }

  getTabConfiguration(tab) {
    return this.props.config.getForFile(tab.file, DEPLOYMENT_CONFIG_KEY);
  }

  setTabConfiguration(tab, configuration) {
    return this.props.config.setForFile(
      tab.file,
      DEPLOYMENT_CONFIG_KEY,
      configuration
    );
  }

  onSimulateSuccess(response, configuration, options = {}) {
    const { config, savedTab } = configuration;

    const { displayNotification, triggerAction } = this.props;

    const { endpoint } = config;

    const { isStart } = options;

    const { gatewayVersion } = options;

    const content = null;

    if (!options.skipNotificationOnSuccess) {
      displayNotification({
        type: "success",
        title: this._getSuccessNotification(savedTab),
        content: content,
        duration: 8000,
      });
    }

    // notify interested parties
    triggerAction("emit-event", {
      type: "simulate.done",
      payload: {
        simulate: response,
        context: isStart ? "startInstanceTool" : "simulateTool",
        targetType: endpoint && endpoint.targetType,
        simulateedTo: {
          executionPlatformVersion: gatewayVersion,
          executionPlatform: ENGINES.CLOUD,
        },
      },
    });
  }

  _getSuccessNotification(tab) {
    return "Process simulated";
  }

  onSimulateError(response, configuration, options = {}) {
    const { config } = configuration;

    const { log, displayNotification, triggerAction } = this.props;

    const { endpoint } = config;

    const { isStart } = options;

    const { gatewayVersion } = options;

    // If we retrieved the gatewayVersion, include it in event
    const simulateedTo =
      (gatewayVersion && {
        executionPlatformVersion: gatewayVersion,
        executionPlatform: ENGINES.CLOUD,
      }) ||
      undefined;

    const logMessage = {
      category: "simulate-error",
      message: response.details || response.message,
      silent: true,
    };

    log(logMessage);

    const content = (
      <button onClick={() => triggerAction("open-log")}>
        See the log for further details.
      </button>
    );

    displayNotification({
      type: "error",
      title: "Simulate failed",
      content,
      duration: 4000,
    });

    // notify interested parties
    triggerAction("emit-event", {
      type: "simulate.error",
      payload: {
        error: {
          ...response,
          code: getGRPCErrorCode(response),
        },
        context: isStart ? "startInstanceTool" : "simulateTool",
        ...(simulateedTo && { simulateedTo: simulateedTo }),
        targetType: endpoint && endpoint.targetType,
      },
    });
  }

  closeOverlay() {
    this.setState({ overlayState: null });
  }

  onIconClicked = () => {
    const { overlayState } = this.state;

    if (overlayState && !overlayState.isStart) {
      this.closeOverlay();
    } else this.simulate();
  };

  isButtonActive = () => {
    const { overlayState } = this.state;

    return overlayState ? !overlayState.isStart : null;
  };

  render() {
    const { overlayState, activeTab } = this.state;

    return (
      <React.Fragment>
        {isSimuTab(activeTab) && (
          <Fill slot="status-bar__file" group="8_simulate" priority={1}>
            <button
              onClick={this.onIconClicked}
              title="Simulate current diagram"
              className={classNames("btn", css.SimulatePlugin, {
                "btn--active": this.isButtonActive(),
              })}
              ref={this._anchorRef}
            >
              <DeployIcon className="icon" />
            </button>
          </Fill>
        )}
        {overlayState && (
          <SimulatePluginOverlay
            onClose={overlayState.onClose}
            onSimulate={overlayState.onClose}
            onAbort={overlayState.onClose}
            isStart={overlayState.isStart}
            config={overlayState.config}
            anchor={overlayState.anchorRef.current}
          />
        )}
      </React.Fragment>
    );
  }
}

// helpers //////////

function withoutExtension(name) {
  return name.replace(/\.[^.]+$/, "");
}

function addOrUpdateById(collection, element) {
  const index = collection.findIndex((el) => el.id === element.id);

  if (index !== -1) {
    return [
      ...collection.slice(0, index),
      element,
      ...collection.slice(index + 1),
    ];
  }

  return [...collection, element];
}

function withoutCredentials(endpointConfiguration) {
  return omit(endpointConfiguration, [
    "clientId",
    "clientSecret",
    "camundaCloudClientId",
    "camundaCloudClientSecret",
  ]);
}

function isSimuTab(tab) {
  return tab && ["simu-bpmn"].includes(tab.type);
}

function getGRPCErrorCode(error) {
  const { code } = error;

  return code ? GRPC_ERROR_CODES[code] : "UNKNOWN";
}
