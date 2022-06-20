/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export const PRIVACY_TEXT_FIELD =
  "To enhance user experience, we require external network requests. Please choose from the settings below.";

export const LEARN_MORE_TEXT =
  "With any of these options, none of your personal information or stored data will be submitted. ";

export const PRIVACY_POLICY_TEXT = " Privacy Policy";

export const OK_BUTTON_TEXT = "Save";

export const CANCEL_BUTTON_TEXT = "Cancel";

export const TITLE = "Privacy Preferences";

export const DEFAULT_VALUES = {
  ENABLE_CRASH_REPORTS: false,
  ENABLE_USAGE_STATISTICS: false,
  ENABLE_UPDATE_CHECKS: false,
};

export const PREFERENCES_LIST = [
  {
    title: "Enable Error Reports",
    explanation:
      "Allow the Modeler to send error reports containing stack traces and unhandled exceptions.",
    key: "ENABLE_CRASH_REPORTS",
  },
  {
    title: "Enable Usage Statistics",
    explanation: "Allow the Modeler to send pseudonymised usage statistics.",
    key: "ENABLE_USAGE_STATISTICS",
  },
  {
    title: "Enable Update Checks",
    explanation: "Allow the Modeler to periodically check for new updates.",
    key: "ENABLE_UPDATE_CHECKS",
  },
];
