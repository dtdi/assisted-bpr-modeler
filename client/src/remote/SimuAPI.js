/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export const authTypes = {
  NONE: "none",
  OAUTH: "oauth",
};

export const targetTypes = {
  SELF_HOSTED: "selfHosted",
  CAMUNDA_CLOUD: "camundaCloud",
};

/**
 * SimuAPI for deployment/run instance.
 */
export default class SimuAPI {
  constructor(backend) {
    this.backend = backend;
  }

  checkConnection(endpoint) {
    const configuration = getEndpointConfiguration(endpoint);

    return this.backend.send("simu:checkConnection", {
      endpoint: configuration,
    });
  }

  deploy(options) {
    const { endpoint } = options;

    const configuration = getEndpointConfiguration(endpoint);

    return this.backend.send("simu:deploy", {
      ...options,
      endpoint: configuration,
    });
  }

  simulate(options) {
    return this.backend.send("simu:simulate", options);
  }

  abortSimulations(options) {
    return this.backend.send("simu:abort", options);
  }

  getGatewayVersion(endpoint) {
    const configuration = getEndpointConfiguration(endpoint);

    return this.backend.send("simu:getGatewayVersion", {
      endpoint: configuration,
    });
  }
}

// helpers //////////////////

function getEndpointConfiguration(endpoint) {
  const {
    authType,
    audience,
    targetType,
    clientId,
    clientSecret,
    oauthURL,
    contactPoint,
    camundaCloudClientId,
    camundaCloudClientSecret,
    camundaCloudClusterId,
    camundaCloudClusterRegion,
  } = endpoint;

  if (targetType === targetTypes.SELF_HOSTED) {
    switch (authType) {
      case authTypes.NONE:
        return {
          type: targetTypes.SELF_HOSTED,
          url: contactPoint,
        };

      case authTypes.OAUTH:
        return {
          type: authTypes.OAUTH,
          url: contactPoint,
          oauthURL,
          audience,
          clientId,
          clientSecret,
        };
    }
  }

  if (targetType === targetTypes.CAMUNDA_CLOUD) {
    return {
      type: targetTypes.CAMUNDA_CLOUD,
      clientId: camundaCloudClientId,
      clientSecret: camundaCloudClientSecret,
      clusterId: camundaCloudClusterId,
      ...(camundaCloudClusterRegion
        ? { clusterRegion: camundaCloudClusterRegion }
        : {}),
    };
  }
}
