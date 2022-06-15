/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

"use strict";

const path = require("path");
const fs = require("fs");
var crypto = require("crypto");
const { setTimeout } = require("node:timers/promises");
const { exec, spawn } = require("child_process");
const { tmpdir } = require("os");

const log = require("./log")("app:simu-api");

const errorReasons = {
  UNKNOWN: "UNKNOWN",
  CONTACT_POINT_UNAVAILABLE: "CONTACT_POINT_UNAVAILABLE",
  UNAUTHORIZED: "UNAUTHORIZED",
  CLUSTER_UNAVAILABLE: "CLUSTER_UNAVAILABLE",
  FORBIDDEN: "FORBIDDEN",
  OAUTH_URL: "OAUTH_URL",
  UNSUPPORTED_ENGINE: "UNSUPPORTED_ENGINE",
  TIMEOUT: "TIMEOUT",
};

const TIMEOUT = 15 * 1000;

const endpointTypes = {
  SELF_HOSTED: "selfHosted",
  OAUTH: "oauth",
  CAMUNDA_CLOUD: "camundaCloud",
};

class SimuAPI {
  constructor(fileSystem) {
    this._fs = fileSystem;
    this._resourcesPath = fileSystem.resourcesPath;
    this.cancelTask = null;
  }

  async _simulate(parameters = {}) {
    const { filePath, fileContents, signal } = { ...parameters };
    let originalPath = filePath;
    if (!originalPath) {
      originalPath = tmpdir();
    }

    const taskDone = new AbortController();
    let proc;

    if (signal.aborted === true)
      throw new Error("Operation cancelled externally beforehand");

    signal.addEventListener(
      "abort",
      () => {
        log.info(
          "Operation cancelled externally: " + `taskkill /f /PID ${proc.pid}`
        );
        exec(`taskkill /f /PID ${proc.pid}`);
      },
      {
        once: true,
        signal: taskDone.signal,
      }
    );

    return new Promise((resolve, reject) => {
      try {
        if (signal.aborted)
          throw new Error("Operation cancelled externally beforehand");

        var algorithm = "sha1",
          shasum = crypto.createHash(algorithm);
        var hash = shasum.update(fileContents).digest("hex");

        const directory = path.join(path.dirname(originalPath), "sim");
        log.info("Simulation output directory", directory);
        fs.mkdirSync(directory, { recursive: true });

        const filePath = path.join(directory, hash + ".bpmn");
        fs.writeFileSync(filePath, fileContents, { encoding: false });

        const resourcesPath = path.join(
          this._resourcesPath,
          "scylla",
          "scylla-0.0.1-SNAPSHOT.jar"
        );

        proc = spawn("java", ["-jar", resourcesPath, `--config=${filePath}`]);

        let output = "";
        proc.stderr.on("data", (data) => {
          output += data;
        });
        proc.stdout.on("data", (data) => {
          output += data;
        });

        proc.on("error", (err) => {
          log.error(err);
        });

        proc.on("close", (code) => {
          const simuPath = output.match(
            /Wrote activity statistics to ([^\r\n]+)/
          );

          if (simuPath && simuPath.length == 2) {
            const outputPath = path.parse(simuPath[1]);
            const { contents } = this._fs.readFile(path.format(outputPath), {
              encoding: false,
            });
            rimraf(outputPath.dir);
            fs.unlinkSync(filePath);

            taskDone.abort();

            resolve({
              success: true,
              response: contents.toString(),
            });
          } else {
            resolve({
              success: false,
              response: "Falilure: " + output,
            });
          }
        });
      } catch (err) {
        log.info(err);
        taskDone.abort();
        resolve({
          success: false,
          response: err,
        });
      }
    });
  }

  async simulate(parameters = {}) {
    const that = this;

    if (!that.cancelTask || that.cancelTask.signal.aborted)
      that.cancelTask = new AbortController();

    const cancelTimer = new AbortController();

    async function timeout() {
      try {
        await setTimeout(TIMEOUT, undefined, {
          signal: cancelTimer.signal,
        });
        log.error("Time Exceeded");
        that.cancelTask.abort();
        return { success: false, response: `Timeout: ${timeout}ms` };
      } catch (err) {
        return { success: false, response: "Timeout cancelled" };
      }
    }

    async function startSimulation() {
      let result;
      try {
        result = await that._simulate({
          ...parameters,
          signal: that.cancelTask.signal,
        });
      } catch (err) {
        result = err;
      } finally {
        cancelTimer.abort();
        return result;
      }
    }

    return await Promise.race([timeout(), startSimulation()]);
  }

  async abortSimulation(parameters = {}) {
    if (this.cancelTask && this.cancelTask.signal) {
      if (this.cancelTask.signal.aborted) {
        return {
          success: false,
          response: "not running",
        };
      } else {
        this.cancelTask.abort();
        log.info("abort simulations");
        return { success: true, response: "aborted" };
      }
    }
  }
}

module.exports = SimuAPI;

// helpers //////////////////////

function getErrorReason(error, endpoint) {
  const { code, message } = error;

  const { type } = endpoint;

  // (1) handle grpc errors
  if (code === 14) {
    return type === endpointTypes.CAMUNDA_CLOUD
      ? errorReasons.CLUSTER_UNAVAILABLE
      : errorReasons.CONTACT_POINT_UNAVAILABLE;
  } else if (code === 12) {
    return errorReasons.UNSUPPORTED_ENGINE;
  }

  // (2) handle <unknown>
  if (!message) {
    return errorReasons.UNKNOWN;
  }

  // (3) handle <not found>
  if (message.includes("ENOTFOUND") || message.includes("Not Found")) {
    if (type === endpointTypes.OAUTH) {
      return errorReasons.OAUTH_URL;
    } else if (type === endpointTypes.CAMUNDA_CLOUD) {
      return errorReasons.CLUSTER_UNAVAILABLE;
    }

    return errorReasons.CONTACT_POINT_UNAVAILABLE;
  }

  // (4) handle other error messages
  if (message.includes("Unauthorized")) {
    return errorReasons.UNAUTHORIZED;
  }

  if (message.includes("Forbidden")) {
    return errorReasons.FORBIDDEN;
  }

  if (
    message.includes("Unsupported protocol") &&
    type === endpointTypes.OAUTH
  ) {
    return errorReasons.OAUTH_URL;
  }

  return errorReasons.UNKNOWN;
}

/**
 * Remove directory recursively
 * @param {string} dir_path
 * @see https://stackoverflow.com/a/42505874/3027390
 */
function rimraf(dir_path) {
  if (fs.existsSync(dir_path)) {
    fs.readdirSync(dir_path).forEach(function (entry) {
      var entry_path = path.join(dir_path, entry);
      if (fs.lstatSync(entry_path).isDirectory()) {
        rimraf(entry_path);
      } else {
        fs.unlinkSync(entry_path);
      }
    });
    fs.rmdirSync(dir_path);
  }
}
