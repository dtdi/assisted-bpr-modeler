/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { isNumber } from "min-dash";

import { getProcessVariablesCount } from "./processVariables";

import { getUserTaskMetrics } from "./userTasks";

import { getServiceTaskMetrics } from "./serviceTasks";

import { getSubprocessPlaneMetrics } from "./subprocessPlanes";
import { getSimuTaskMetrics } from "./simuTasks";

export default async function (file, type) {
  let metrics = {};

  // (1) process variables
  const processVariablesCount = await getProcessVariablesCount(file, type);

  if (isNumber(processVariablesCount)) {
    metrics = {
      ...metrics,
      processVariablesCount,
    };
  }

  // (2) elements

  // (2.1) simu tasks
  const simuTaskMetrics = await getSimuTaskMetrics(file, type);

  metrics = {
    ...metrics,
    tasks: {
      simuTask: simuTaskMetrics,
    },
  };

  return metrics;
}
