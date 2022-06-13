import { forEach } from "min-dash";

import { PALETTE_OPTIONS as availableActions } from "./PaletteOptions";

const LOW_PRIORITY = 500;
export default class PaletteProvider {
  constructor(palette, eventBus) {
    palette.registerProvider(LOW_PRIORITY, this);
    this._eventBus = eventBus;
  }

  getPaletteEntries(element) {
    const self = this;
    return function (entries) {
      forEach(entries, function (entry, key) {
        if (!availableActions.includes(key)) {
          delete entries[key];
        }
      });

      entries["bsim-seperator"] = {
        group: "bsim",
        separator: true,
      };
      entries["bsim.edit-simulation-config"] = {
        group: "bsim",
        className: "bpmn-icon-subprocess-expanded",
        title: "Edit Simulation Configuration",
        action: {
          click: () => {
            self._eventBus.fire("bsim.toggle-config-modal");
          },
        },
      };

      return entries;
    };
  }
}

PaletteProvider.$inject = ["palette", "eventBus"];
