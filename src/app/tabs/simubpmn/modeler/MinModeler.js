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

import bsimModdlePackage from "bsim-bpmn-moddle/resources/bsim";
import bsimApiModdlePackage from "bsim-bpmn-moddle/resources/bsimapi";
import abprModdlePackage from "bsim-bpmn-moddle/resources/abpr";
import bsimImporter from "./features/bsim-importer";

export default class MinModeler extends BpmnModeler {
  constructor(options = {}) {
    const { moddleExtensions, ...otherOptions } = options;

    super({
      ...otherOptions,
      moddleExtensions: {
        bsim: bsimModdlePackage,
        bsimapi: bsimApiModdlePackage,
        abpr: abprModdlePackage,
        ...(moddleExtensions || {}),
      },
    });
  }
}

const defaultModules = BpmnModeler.prototype._modules;

const extensionModules = [bsimImporter];

MinModeler.prototype._modules = [...defaultModules, ...extensionModules];
