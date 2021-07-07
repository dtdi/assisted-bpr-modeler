/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import "./styles/style.less";

import React from "react";
import ReactDOM from "react-dom";

import { AppParent, KeyboardBindings, TabsProvider } from "./app";

import Metadata from "./util/Metadata";
import Flags from "./util/Flags";

import debug from "debug";

if (process.env.NODE_ENV !== "production") {
  debug.enable("*,-sockjs-client:*");
}

import {
  backend,
  config,
  dialog,
  fileSystem,
  plugins,
  flags,
  log,
  metadata,
  workspace,
} from "./remote";

Metadata.init({ name: "Camunda Modeler", version: "Dev" });
Flags.init({});

const isMac = false;

const keyboardBindings = new KeyboardBindings({
  isMac,
});

const tabsProvider = new TabsProvider();

const globals = {
  isMac,
  config,
  plugins,
};

async function render() {
  // load plugins

  const rootElement = document.querySelector("#root");

  const onStarted = () => {
    // mark as finished loading
    document.querySelector("body > .spinner-border").classList.add("hidden");
  };

  ReactDOM.render(
    <AppParent
      keyboardBindings={keyboardBindings}
      globals={globals}
      tabsProvider={tabsProvider}
      onStarted={onStarted}
    />,
    rootElement
  );
}

render();
