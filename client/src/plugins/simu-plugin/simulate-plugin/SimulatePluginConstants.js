/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export const OVERLAY_TITLE = "Simulate diagram";
export const ENDPOINT_CONFIGURATION_TITLE = "Endpoint Configuration";
export const CANCEL = "Cancel";
export const SIMULATE = "Simulate";
export const NEXT = "Next";

export const DEPLOYMENT_NAME = "Deployment name";
export const SELF_HOSTED_TEXT = "Camunda Platform 8 Self-Managed";
export const OAUTH_TEXT = "OAuth";
export const NONE = "None";
export const CAMUNDA_CLOUD_TEXT = "Camunda Platform 8 SaaS";
export const CONTACT_POINT = "Cluster endpoint";
export const DEPLOYMENT_NAME_HINT = "Default value is the file name.";
export const CONTACT_POINT_HINT = "0.0.0.0:26500";
export const OAUTH_URL = "OAuth URL";
export const AUDIENCE = "Audience";
export const CLIENT_ID = "Client ID";
export const CLIENT_SECRET = "Client secret";
export const CLUSTER_URL = "Cluster URL";
export const REMEMBER_CREDENTIALS = "Remember credentials";

export const MUST_PROVIDE_A_VALUE = "Must provide a value.";
export const CONTACT_POINT_MUST_NOT_BE_EMPTY =
  "Cluster endpoint must not be empty.";
export const CONTACT_POINT_MUST_BE_URL_OR_IP =
  "Cluster endpoint must a valid URL or IP address with a valid port.";
export const OAUTH_URL_MUST_NOT_BE_EMPTY = "OAuth URL must not be empty.";
export const AUDIENCE_MUST_NOT_BE_EMPTY = "Audience must not be empty.";
export const CLIENT_ID_MUST_NOT_BE_EMPTY = "Client ID must not be empty.";
export const CLIENT_SECRET_MUST_NOT_BE_EMPTY =
  "Client Secret must not be empty.";
export const FILL_IN_ALL_THE_FIELDS = "You must fill in all the fields";
export const CLUSTER_URL_MUST_BE_VALID_CLOUD_URL =
  "Must be a valid Camunda Cloud URL.";

export const ERROR_REASONS = {
  UNKNOWN: "UNKNOWN",
  CONTACT_POINT_UNAVAILABLE: "CONTACT_POINT_UNAVAILABLE",
  CLUSTER_UNAVAILABLE: "CLUSTER_UNAVAILABLE",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  OAUTH_URL: "OAUTH_URL",
  UNSUPPORTED_ENGINE: "UNSUPPORTED_ENGINE",
};

export const CONNECTION_ERROR_MESSAGES = {
  [ERROR_REASONS.CONTACT_POINT_UNAVAILABLE]:
    "Should point to a running Zeebe cluster.",
  [ERROR_REASONS.CLUSTER_UNAVAILABLE]:
    "Should point to a running Zeebe cluster.",
  [ERROR_REASONS.UNAUTHORIZED]: "Credentials do not match with the server.",
  [ERROR_REASONS.FORBIDDEN]:
    "This user is not permitted to deploy. Please use different credentials or get this user enabled to deploy.",
  [ERROR_REASONS.OAUTH_URL]: "Should point to a running OAuth service.",
  [ERROR_REASONS.UNKNOWN]: "Unknown error. Please check Zeebe cluster status.",
  [ERROR_REASONS.UNSUPPORTED_ENGINE]: "Unsupported Zeebe version.",
};
