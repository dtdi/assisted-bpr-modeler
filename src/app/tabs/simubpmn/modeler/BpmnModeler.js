/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import BpmnModeler from "bpmn-js/lib/Modeler";

import minimapModule from "diagram-js-minimap";

import lintModule from "bpmn-js-bpmnlint";
import bpmnlintConfig from "../.bpmnlintrc";

import diagramOriginModule from "diagram-js-origin";

import alignToOriginModule from "@bpmn-io/align-to-origin";
import addExporterModule from "@bpmn-io/add-exporter";

import executableFixModule from "bpmn-js-executable-fix";

import completeDirectEditingModule from "./features/complete-direct-editing";
import globalClipboardModule from "./features/global-clipboard";
import handToolOnSpaceModule from "./features/hand-tool-on-space";
import propertiesPanelKeyboardBindingsModule from "./features/properties-panel-keyboard-bindings";

import Flags, { DISABLE_ADJUST_ORIGIN } from "../../../../util/Flags";

import bsimModdlePackage from "bsim-bpmn-moddle/resources/bsim";
import bsimApiModdlePackage from "bsim-bpmn-moddle/resources/bsimapi";
import abprModdlePackage from "bsim-bpmn-moddle/resources/abpr";
import camundaModdlePackage from "bsim-bpmn-moddle/resources/camunda";

import bsimImporter from "./features/bsim-importer";
import bsimModeler from "./features/modeling";

import propertiesPanelModule from "bpmn-js-properties-panel";
import propertiesProviderModule from "bpmn-js-properties-panel/lib/provider/camunda";

import redesignPanelModule from "./features/redesign-panel";
import copyPasteModule from "./features/copy-paste";
import recommenderModule from "./recommender";
import redesignStack from "./command";
import redesignModule from "./redesign";
import paletteModule from "./features/palette";

import "bpmn-js-properties-panel/styles/properties.less";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "bpmn-js-bpmnlint/dist/assets/css/bpmn-js-bpmnlint.css";
import "diagram-js-minimap/assets/diagram-js-minimap.css";

export default class SimuBpmnModeler extends BpmnModeler {
  constructor(options = {}) {
    const { moddleExtensions, ...otherOptions } = options;

    super({
      ...otherOptions,
      moddleExtensions: {
        bsim: bsimModdlePackage,
        bsimapi: bsimApiModdlePackage,
        abpr: abprModdlePackage,
        camunda: camundaModdlePackage,
        ...(moddleExtensions || {}),
      },
      linting: {
        bpmnlint: bpmnlintConfig,
        active: true,
      },
    });
  }
}

const defaultModules = BpmnModeler.prototype._modules;

const extensionModules = [
  addExporterModule,
  completeDirectEditingModule,
  executableFixModule,
  Flags.get(DISABLE_ADJUST_ORIGIN) ? diagramOriginModule : alignToOriginModule,
  globalClipboardModule,
  handToolOnSpaceModule,
  minimapModule,
  //propertiesPanelKeyboardBindingsModule,
  propertiesPanelModule,
  propertiesProviderModule,

  bsimImporter,
  lintModule,
  redesignModule,
  redesignPanelModule,
  copyPasteModule,
  paletteModule,
  recommenderModule,
  redesignStack,
  bsimModeler,
];

SimuBpmnModeler.prototype._modules = [...defaultModules, ...extensionModules];
