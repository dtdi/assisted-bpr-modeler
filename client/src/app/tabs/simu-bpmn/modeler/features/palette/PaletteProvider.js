import { forEach } from "min-dash";

import { PALETTE_OPTIONS as availableActions } from "./PaletteOptions";

const LOW_PRIORITY = 500;
export default class PaletteProvider {
  constructor(palette, selection, elementRegistry) {
    palette.registerProvider(LOW_PRIORITY, this);
    this._selection = selection;
    this._elementRegistry = elementRegistry;
  }

  getPaletteEntries(element) {
    const self = this;
    return function (entries) {
      forEach(entries, function (entry, key) {
        if (!availableActions.includes(key)) {
          delete entries[key];
        }
      });

      return entries;
    };
  }
}

PaletteProvider.$inject = ["palette", "selection", "elementRegistry"];
