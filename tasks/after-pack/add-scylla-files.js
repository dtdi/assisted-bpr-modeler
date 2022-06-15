/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const fs = require("fs");

const { copy: _copyGlob } = require("cpx");

const { promisify } = require("util");

const { Transform: TransformStream } = require("stream");

const copyGlob = promisify(_copyGlob);

const { name, version } = require("../../app/package");
const path = require("path");

module.exports = async function (context) {
  const { appOutDir, electronPlatformName } = context;

  const outPath = path.join(appOutDir, "resources", "scylla");

  console.log(outPath);

  await copyGlob("resources/scylla/**", outPath, {});
};

// helpers ///////////////////////

function copy(src, dest) {
  fs.copyFileSync(src, dest);
}
