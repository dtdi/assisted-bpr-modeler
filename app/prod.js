/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const pkg = require("./package");

require("dotenv").config();

// ensure production mode
process.env.NODE_ENV = "production";

// Injected to pkg via electron-builder extraMetadata configuration.
process.env.SENTRY_DSN = pkg.SENTRY_DSN;

require("./lib");
