/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import bpmnDiagram from "./tabs/bpmn/diagram.bpmn";
import simuBpmnDiagram from "./tabs/simu-bpmn/diagram.bpmn";
import cloudBpmnDiagram from "./tabs/cloud-bpmn/diagram.bpmn";
import cmmnDiagram from "./tabs/cmmn/diagram.cmmn";
import dmnDiagram from "./tabs/dmn/diagram.dmn";
import cloudDmnDiagram from "./tabs/cloud-dmn/diagram.dmn";
import form from "./tabs/form/initial.form";
import cloudForm from "./tabs/form/initial-cloud.form";

import { ENGINES, ENGINE_PROFILES } from "../util/Engines";

import replaceIds from "@bpmn-io/replace-ids";

import { sortBy } from "min-dash";

import EmptyTab from "./EmptyTab";

import { find, forEach } from "min-dash";

import parseDiagramType from "./util/parseDiagramType";

import parseExecutionPlatform from "./util/parseExecutionPlatform";

import Metadata from "../util/Metadata";

import { findUsages as findNamespaceUsages } from "./tabs/util/namespace";

import { generateId } from "../util";

import BpmnLinter from "./tabs/bpmn/linting/BpmnLinter";
import CloudBpmnLinter from "./tabs/cloud-bpmn/linting/CloudBpmnLinter";
import SimuBpmnLinter from "./tabs/simu-bpmn/linting/SimuBpmnLinter";

import FormLinter from "./tabs/form/linting/FormLinter";

import Flags, {
  DISABLE_DMN,
  DISABLE_FORM,
  DISABLE_ZEEBE,
  DISABLE_PLATFORM,
  DISABLE_CMMN,
} from "../util/Flags";

import BPMNIcon from "../../resources/icons/file-types/BPMN-16x16.svg";
import DMNIcon from "../../resources/icons/file-types/DMN-16x16.svg";
import FormIcon from "../../resources/icons/file-types/Form-16x16.svg";

const createdByType = {};

const noopProvider = {
  getComponent() {
    return null;
  },
  getInitialContents() {
    return null;
  },
};

const ENCODING_BASE64 = "base64",
  ENCODING_UTF8 = "utf8";

const EXPORT_JPEG = {
  name: "JPEG image",
  encoding: ENCODING_BASE64,
  extensions: ["jpeg"],
};

const EXPORT_PNG = {
  name: "PNG image",
  encoding: ENCODING_BASE64,
  extensions: ["png"],
};

const EXPORT_SVG = {
  name: "SVG image",
  encoding: ENCODING_UTF8,
  extensions: ["svg"],
};

const NAMESPACE_URL_ZEEBE = "http://camunda.org/schema/zeebe/1.0";

const DEFAULT_PRIORITY = 1000;

const HIGHER_PRIORITY = 1001;

/**
 * A provider that allows us to customize available tabs.
 */
export default class TabsProvider {
  constructor() {
    this.providers = {
      empty: {
        canOpen(file) {
          return false;
        },
        getComponent() {
          return EmptyTab;
        },
        getIcon() {
          return null;
        },
      },
      "cloud-bpmn": {
        name: "BPMN",
        encoding: ENCODING_UTF8,
        exports: {
          png: EXPORT_PNG,
          jpeg: EXPORT_JPEG,
          svg: EXPORT_SVG,
        },
        extensions: ["bpmn", "xml"],
        priority: HIGHER_PRIORITY,
        canOpen(file) {
          const { contents } = file;

          // (0) can open only BPMN files
          if (parseDiagramType(contents) !== "bpmn") {
            return false;
          }

          // (1) detect execution platform
          const executionPlatformDetails = parseExecutionPlatform(contents);

          if (executionPlatformDetails) {
            return ["Camunda Cloud", "Zeebe"].includes(
              executionPlatformDetails.executionPlatform
            );
          }

          // (2) detect zeebe namespace
          const used = findNamespaceUsages(contents, NAMESPACE_URL_ZEEBE);

          return !!used;
        },
        getComponent(options) {
          return import("./tabs/cloud-bpmn");
        },
        getIcon() {
          return BPMNIcon;
        },
        getInitialContents(options) {
          return cloudBpmnDiagram;
        },
        getInitialFilename(suffix) {
          return `diagram_${suffix}.bpmn`;
        },
        getHelpMenu() {
          return [];
        },
        getNewFileMenu() {
          return [
            {
              label: "BPMN diagram",
              group: "Camunda Platform 8",
              action: "create-cloud-bpmn-diagram",
            },
          ];
        },
        getLinter() {
          return CloudBpmnLinter;
        },
      },
      "simu-bpmn": {
        name: "BPMN",
        encoding: ENCODING_UTF8,
        exports: {
          png: EXPORT_PNG,
          jpeg: EXPORT_JPEG,
          svg: EXPORT_SVG,
        },
        extensions: ["simubpmn", "xml"],
        priority: DEFAULT_PRIORITY,
        canOpen(file) {
          const { contents } = file;

          // (0) can open only BPMN files
          if (parseDiagramType(contents) !== "bpmn") {
            return false;
          }
        },
        getComponent(options) {
          return import("./tabs/simu-bpmn");
        },
        getIcon() {
          return BPMNIcon;
        },
        getInitialContents(options) {
          return simuBpmnDiagram;
        },
        getInitialFilename(suffix) {
          return `diagram_${suffix}.simubpmn`;
        },
        getHelpMenu() {
          return [
            {
              label: "simuBPMN Overview",
              action:
                "https://dtdi.github.io/assisted-bpr-modeler/simu-bpmn?utm_source=modeler&utm_medium=referral",
            },
            {
              label: "aBPR Modeler Docs",
              action:
                "https://dtdi.github.io/assisted-bpr-modeler?utm_source=modeler&utm_medium=referral",
            },
          ];
        },
        getNewFileMenu() {
          return [
            {
              label: "simuBPMN diagram",
              group: "DTDI aBPR",
              action: "create-simu-bpmn-diagram",
            },
          ];
        },
        getLinter() {
          return SimuBpmnLinter;
        },
      },
      bpmn: {
        name: "BPMN",
        encoding: ENCODING_UTF8,
        exports: {
          png: EXPORT_PNG,
          jpeg: EXPORT_JPEG,
          svg: EXPORT_SVG,
        },
        extensions: ["bpmn", "xml"],
        canOpen(file) {
          return parseDiagramType(file.contents) === "bpmn";
        },
        getComponent(options) {
          return import("./tabs/bpmn");
        },
        getIcon() {
          return BPMNIcon;
        },
        getInitialContents(options) {
          return bpmnDiagram;
        },
        getInitialFilename(suffix) {
          return `diagram_${suffix}.bpmn`;
        },
        getHelpMenu() {
          return [
            {
              label: "BPMN 2.0 Tutorial",
              action: "https://camunda.org/bpmn/tutorial/",
            },
            {
              label: "BPMN Modeling Reference",
              action: "https://camunda.org/bpmn/reference/",
            },
          ];
        },
        getNewFileMenu() {
          return [
            {
              label: "BPMN diagram",
              group: "Camunda Platform 7",
              action: "create-bpmn-diagram",
            },
          ];
        },
        getLinter() {
          return BpmnLinter;
        },
      },
      cmmn: {
        name: "CMMN",
        encoding: ENCODING_UTF8,
        exports: {
          png: EXPORT_PNG,
          jpeg: EXPORT_JPEG,
          svg: EXPORT_SVG,
        },
        extensions: ["cmmn", "xml"],
        canOpen(file) {
          return parseDiagramType(file.contents) === "cmmn";
        },
        getComponent(options) {
          return import("./tabs/cmmn");
        },
        getIcon() {
          return null;
        },
        getInitialContents(options) {
          return cmmnDiagram;
        },
        getInitialFilename(suffix) {
          return `diagram_${suffix}.cmmn`;
        },
        getHelpMenu() {
          return [
            {
              label: "CMMN 1.1 Tutorial",
              action: "https://docs.camunda.org/get-started/cmmn11/",
            },
            {
              label: "CMMN Modeling Reference",
              action:
                "https://docs.camunda.org/manual/latest/reference/cmmn11/",
            },
          ];
        },
        getNewFileMenu() {
          return [
            {
              label: "CMMN diagram",
              group: "Camunda Platform 7",
              action: "create-cmmn-diagram",
            },
          ];
        },
        getLinter() {
          return null;
        },
      },
      "cloud-dmn": {
        name: "DMN",
        encoding: ENCODING_UTF8,
        exports: {
          png: EXPORT_PNG,
          jpeg: EXPORT_JPEG,
          svg: EXPORT_SVG,
        },
        extensions: ["dmn", "xml"],
        canOpen(file) {
          const { contents } = file;

          // (0) can open only DMN files
          if (parseDiagramType(contents) !== "dmn") {
            return false;
          }

          // (1) detect execution platform
          const executionPlatformDetails = parseExecutionPlatform(contents);

          if (executionPlatformDetails) {
            return (
              executionPlatformDetails.executionPlatform === "Camunda Cloud"
            );
          }

          // (2) don't open DMN files without execution platform
          return false;
        },
        getComponent(options) {
          return import("./tabs/cloud-dmn");
        },
        getIcon() {
          return DMNIcon;
        },
        getInitialContents() {
          return cloudDmnDiagram;
        },
        getInitialFilename(suffix) {
          return `diagram_${suffix}.dmn`;
        },
        getHelpMenu() {
          return [
            {
              label: "DMN Tutorial",
              action: "https://camunda.org/dmn/tutorial/",
            },
          ];
        },
        getNewFileMenu() {
          return [
            {
              label: "DMN diagram",
              group: "Camunda Platform 8",
              action: "create-cloud-dmn-diagram",
            },
          ];
        },
        getLinter() {
          return null;
        },
      },
      dmn: {
        name: "DMN",
        encoding: ENCODING_UTF8,
        exports: {
          png: EXPORT_PNG,
          jpeg: EXPORT_JPEG,
          svg: EXPORT_SVG,
        },
        extensions: ["dmn", "xml"],
        canOpen(file) {
          return parseDiagramType(file.contents) === "dmn";
        },
        getComponent(options) {
          return import("./tabs/dmn");
        },
        getIcon() {
          return DMNIcon;
        },
        getInitialContents() {
          return dmnDiagram;
        },
        getInitialFilename(suffix) {
          return `diagram_${suffix}.dmn`;
        },
        getHelpMenu() {
          return [
            {
              label: "DMN Tutorial",
              action: "https://camunda.org/dmn/tutorial/",
            },
          ];
        },
        getNewFileMenu() {
          return [
            {
              label: "DMN diagram",
              group: "Camunda Platform 7",
              action: "create-dmn-diagram",
            },
          ];
        },
        getLinter() {
          return null;
        },
      },
      "cloud-form": {
        name: "FORM",
        encoding: ENCODING_UTF8,
        exports: {},
        extensions: ["form"],
        canOpen(file) {
          const { contents } = file;

          try {
            const obj = JSON.parse(contents);
            const { executionPlatform } = obj;
            return (
              file.name.endsWith(".form") && executionPlatform === ENGINES.CLOUD
            );
          } catch (e) {
            return false;
          }
        },
        getComponent(options) {
          return import("./tabs/form");
        },
        getIcon() {
          return FormIcon;
        },
        getInitialContents() {
          return cloudForm;
        },
        getInitialFilename(suffix) {
          return `form_${suffix}.form`;
        },
        getHelpMenu() {
          return [];
        },
        getNewFileMenu() {
          return [
            {
              label: "Form",
              group: "Camunda Platform 8",
              action: "create-cloud-form",
            },
          ];
        },
        getLinter() {
          return FormLinter;
        },
      },
      form: {
        name: "FORM",
        encoding: ENCODING_UTF8,
        exports: {},
        extensions: ["form"],
        canOpen(file) {
          return file.name.endsWith(".form");
        },
        getComponent(options) {
          return import("./tabs/form");
        },
        getIcon() {
          return FormIcon;
        },
        getInitialContents() {
          return form;
        },
        getInitialFilename(suffix) {
          return `form_${suffix}.form`;
        },
        getHelpMenu() {
          return [];
        },
        getNewFileMenu() {
          return [
            {
              label: "Form",
              group: "Camunda Platform 7",
              action: "create-form",
            },
          ];
        },
        getLinter() {
          return FormLinter;
        },
      },
    };

    this.providersByFileType = {
      bpmn: [this.providers["cloud-bpmn"], this.providers.bpmn],
      simubpmn: [this.providers["simu-bpmn"], this.providers["simu-bpmn"]],
      dmn: [this.providers["cloud-dmn"], this.providers.dmn],
      cmmn: [this.providers.cmmn],
      form: [this.providers["cloud-form"], this.providers.form],
    };

    if (Flags.get(DISABLE_ZEEBE)) {
      this.providersByFileType.bpmn = this.providersByFileType.bpmn.filter(
        (p) => p !== this.providers["cloud-bpmn"]
      );
      this.providersByFileType.dmn = this.providersByFileType.dmn.filter(
        (p) => p !== this.providers["cloud-dmn"]
      );
      this.providersByFileType.form = this.providersByFileType.form.filter(
        (p) => p !== this.providers["cloud-form"]
      );
      delete this.providers["cloud-bpmn"];
      delete this.providers["cloud-dmn"];
      delete this.providers["cloud-form"];
    }

    if (Flags.get(DISABLE_PLATFORM)) {
      this.providersByFileType.bpmn = this.providersByFileType.bpmn.filter(
        (p) => p !== this.providers.bpmn
      );
      delete this.providers.bpmn;

      delete this.providers.cmmn;
      delete this.providersByFileType.cmmn;

      delete this.providers.dmn;
      delete this.providersByFileType.dmn;

      delete this.providers.form;
    }

    if (Flags.get(DISABLE_CMMN, true)) {
      delete this.providers.cmmn;
      delete this.providersByFileType.cmmn;
    }

    if (Flags.get(DISABLE_DMN)) {
      delete this.providers.dmn;
      delete this.providers["cloud-dmn"];
      delete this.providersByFileType.dmn;
    }

    if (Flags.get(DISABLE_FORM)) {
      delete this.providers.form;
      delete this.providers["cloud-form"];
      delete this.providersByFileType.form;
    }
  }

  getProviderNames() {
    const names = [];

    forEach(this.providers, (provider) => {
      const { name } = provider;

      if (name && !names.includes(name)) {
        names.push(name);
      }
    });

    return names;
  }

  getProviders() {
    return this.providers;
  }

  hasProvider(fileType) {
    return !!this._getProvidersForExtension(fileType).length;
  }

  getProvider(type) {
    return this.providers[type] || noopProvider;
  }

  getTabComponent(type, options) {
    return this.getProvider(type).getComponent(options);
  }

  getTabIcon(type, options) {
    return this.getProvider(type).getIcon(options);
  }

  createTab(type) {
    const file = this._createFile(type);

    return this.createTabForFile(file);
  }

  createTabForFile(file) {
    const id = generateId();

    const type = this._getTabType(file);

    if (!type) {
      return null;
    }

    // fill empty file with initial contents
    if (!file.contents) {
      file.contents = this._getInitialFileContents(type);
    }

    return {
      file,
      id,
      get name() {
        return this.file.name;
      },
      set name(newName) {
        this.file.name = newName;
      },
      get title() {
        return this.file.path || "(new file)";
      },
      type,
    };
  }

  _createFile(type) {
    const counter =
      type in createdByType ? ++createdByType[type] : (createdByType[type] = 1);

    const name = this._getInitialFilename(type, counter);

    const contents = this._getInitialFileContents(type);

    return {
      name,
      contents,
      path: null,
    };
  }

  _getInitialFilename(providerType, suffix) {
    const provider = this.providers[providerType];

    return provider.getInitialFilename(suffix);
  }

  _getInitialFileContents(type) {
    const rawContents = this.getProvider(type).getInitialContents();

    return (
      rawContents &&
      replaceExporter(replaceVersions(replaceIds(rawContents, generateId)))
    );
  }

  _getTabType(file) {
    const provider = this._getFileProvider(file);

    if (!provider) {
      return null;
    }

    for (let type in this.providers) {
      if (this.providers[type] === provider) {
        return type;
      }
    }
  }

  /**
   * Returns provider if available.
   *
   * Algorithm:
   * * check if there are providers defined for the file extension
   *   * if there is only one, return it (happy path)
   *   * if there are more than one:
   *     * return the first provider which can open the file
   *     * otherwise return the last provider
   *   * if there are none, return the first provider (by priority) which can open the file or `null`
   *
   * @param {import('./TabsProvider').File} file
   * @returns {string | null}
   */
  _getFileProvider(file) {
    const typeFromExtension = getTypeFromFileExtension(file);

    const providersForExtension =
      this._getProvidersForExtension(typeFromExtension);

    // single provider specified for the extension
    if (providersForExtension.length === 1) {
      return providersForExtension[0];
    }

    // multiple providers specified for the extension
    if (providersForExtension.length > 1) {
      const provider = findProviderForFile(providersForExtension, file);

      // return the matching provider or the last provider as fallback
      return (
        provider || providersForExtension[providersForExtension.length - 1]
      );
    }

    // no providers specified for the extension; return the first that can open the file
    const provider = findProviderForFile(sortByPriority(this.providers), file);

    return provider || null;
  }

  _getProvidersForExtension(extension) {
    return this.providersByFileType[extension] || [];
  }
}

// helper ///////////////////

function getTypeFromFileExtension(file) {
  const { name } = file;

  return name.substring(name.lastIndexOf(".") + 1).toLowerCase();
}

function findProviderForFile(providers, file) {
  return find(providers, (provider) => {
    if (provider.canOpen(file)) {
      return provider;
    }
  });
}

/**
 * Sorts a list of providers by priority (descending).
 *
 * @param {Array|Object} providers
 * @returns {Array}
 */
function sortByPriority(providers) {
  return sortBy(providers, (p) => (p.priority || DEFAULT_PRIORITY) * -1);
}

function replaceVersions(contents) {
  const latestPlatformVersion = ENGINE_PROFILES.find(
    (p) => p.executionPlatform === ENGINES.PLATFORM
  ).executionPlatformVersions[0];

  const latestCloudVersion = ENGINE_PROFILES.find(
    (p) => p.executionPlatform === ENGINES.CLOUD
  ).executionPlatformVersions[0];

  return contents
    .replace("{{ CAMUNDA_PLATFORM_VERSION }}", latestPlatformVersion)
    .replace("{{ CAMUNDA_CLOUD_VERSION }}", latestCloudVersion);
}

function replaceExporter(contents) {
  const { name, version } = Metadata;

  return contents
    .replace("{{ EXPORTER_NAME }}", name)
    .replace("{{ EXPORTER_VERSION }}", version);
}
