const path = require("path");
const fs = require("fs");
var crypto = require("crypto");
const { setTimeout } = require("timers/promises");

console.log(process.env.ComSpec);

const exec_path = `-jar C:\\Users\\fehrer\\dtdiwork\\abpr-5\\resources\\scylla\\scylla-0.0.1-SNAPSHOT.jar --config="C:\\Users\\fehrer\\OneDrive - FIM Kernkompetenzzentrum\\Desktop\\sim\\189a1e4791db8b5484b374a32f5cc4a29506a9b8.bpmn"`;

const cancelTask = new AbortController();
const cancelTimer = new AbortController();

let proc;

const { exec, spawn } = require("child_process");

async function _simulate(parameters = {}) {
  const { filePath: originalPath, fileContents, signal } = { ...parameters };

  const taskDone = new AbortController();

  if (signal.aborted === true)
    throw new Error("Operation cancelled externally beforehand");

  signal.addEventListener(
    "abort",
    () => {
      console.error("Operation cancelled externally");
      exec("taskkill /f /PID " + proc.pid);
    },
    {
      once: true,
      signal: taskDone.signal,
    }
  );

  try {
    if (signal.aborted)
      throw new Error("Operation cancelled externally beforehand");

    proc = spawn(
      "java",
      [
        "-jar",
        "C:\\Users\\fehrer\\dtdiwork\\abpr-5\\resources\\scylla\\scylla-0.0.1-SNAPSHOT.jar",
        "--config=C:\\Users\\fehrer\\OneDrive - FIM Kernkompetenzzentrum\\Desktop\\sim\\189a1e4791db8b5484b374a32f5cc4a29506a9b8.bpmn",
      ],
      {}
    );

    let output = "";

    proc.stderr.on("data", (data) => {
      output += data;
    });

    proc.stdout.on("data", (data) => {
      output += data;
    });

    proc.on("error", (err) => {
      console.log(err);
    });

    proc.on("close", (code) => {
      console.log(output);
      console.log("close");
      cancelTimer.abort();

      const simuPath = output.match(/Wrote activity statistics to ([^\r\n]+)/);
      if (simuPath.length == 2) {
        const outputPath = path.parse(simuPath[1]);
        const contents = fs.readFileSync(path.format(outputPath)).toString();
      }
    });

    /**
    if (stdout) {
      console.info(stdout);
    }
    if (stderr) {
      console.error(stderr);
      throw { message: stderr, name: "SimulationException" };
    }

    const simuPath = stdout.match(/Wrote activity statistics to ([^\r\n]+)/);
    if (simuPath.length == 2) {
      const outputPath = path.parse(simuPath[1]);
      const { contents } = this._fs.readFile(path.format(outputPath), {
        encoding: false,
      });
      rimraf(outputPath.dir);
      fs.unlinkSync(filePath);

      console.info("almost done!");

      return {
        success: true,
        response: contents.toString(),
      };
    }
    */
  } catch {}
}

async function simulate(parameters = {}) {
  async function timeout() {
    try {
      await setTimeout(15000, undefined, {
        signal: cancelTimer.signal,
      });
      console.log("kill");
      cancelTask.abort("Time Exceeded");
    } catch (err) {
      return { success: false, response: "esternal stop." };
    }
  }

  async function task() {
    try {
      return await _simulate({
        ...parameters,
        signal: cancelTask.signal,
      });
    } catch (err) {
      return err;
    } finally {
    }
  }
  console.log("asdf");
  return await Promise.race([timeout(), task()]);
}

simulate();

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
