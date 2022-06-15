/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import BpmnModeler from "camunda-bpmn-js/lib/base/Modeler";

import addExporterModule from "@bpmn-io/add-exporter";

import completeDirectEditingModule from "../../bpmn/modeler/features/complete-direct-editing";
import globalClipboardModule from "./features/global-clipboard";
import handToolOnSpaceModule from "../../bpmn/modeler/features/hand-tool-on-space";
import redesignPanelModule from "./features/redesign-panel";
import propertiesPanelKeyboardBindingsModule from "../../bpmn/modeler/features/properties-panel-keyboard-bindings";

import { BsimPropertiesProviderModule } from "bpmn-js-properties-panel";

import Flags, { DISABLE_ADJUST_ORIGIN } from "../../../../util/Flags";

import bsimModdlePackage from "bsim-bpmn-moddle/resources/bsim";
import bsimApiModdlePackage from "bsim-bpmn-moddle/resources/bsimapi";
import abprModdlePackage from "bsim-bpmn-moddle/resources/abpr";
import camundaModdle from "camunda-bpmn-moddle/resources/camunda";

import camundaModdleExtension from "camunda-bpmn-moddle/lib";

import bsimImporter from "./features/bsim-importer";
import bsimModeler from "./features/modeling";
import recommenderModule from "./recommender";
import redesignStack from "./command";
import redesignModule from "./redesign";
import paletteModule from "./features/palette";

import "camunda-bpmn-js/dist/assets/camunda-platform-modeler.css";

export default class SimuBpmnModeler extends BpmnModeler {
  constructor(options = {}) {
    const { moddleExtensions, ...otherOptions } = options;

    super({
      ...otherOptions,
      moddleExtensions: {
        bsim: bsimModdlePackage,
        bsimApiModdlePackage: bsimApiModdlePackage,
        abpr: abprModdlePackage,
        camunda: camundaModdle,
        ...(moddleExtensions || {}),
      },
      disableAdjustOrigin: Flags.get(DISABLE_ADJUST_ORIGIN),
    });
  }
}

const defaultModules = BpmnModeler.prototype._modules;

SimuBpmnModeler.prototype._modules = [
  ...defaultModules,
  camundaModdleExtension,
  addExporterModule,
  completeDirectEditingModule,
  globalClipboardModule,
  handToolOnSpaceModule,
  redesignPanelModule,
  propertiesPanelKeyboardBindingsModule,
  BsimPropertiesProviderModule,
  recommenderModule,
  redesignStack,
  redesignModule,
  paletteModule,

  bsimImporter,
  bsimModeler,
];
