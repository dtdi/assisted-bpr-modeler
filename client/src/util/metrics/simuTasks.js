/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { getAllElementsByType } from "../parse";

export async function getSimuTaskMetrics(file, type) {
  const tasks = await getTasks(file, type);

  const metrics = {
    count: tasks.length,
  };

  return metrics;
}

async function getTasks(file, type) {
  const serviceTasks = await getAllElementsByType(
    file.contents,
    "bpmn:Activity",
    type
  );

  return serviceTasks;
}
