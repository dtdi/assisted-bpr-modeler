import React, { createTheme, getTheme } from "@fluentui/react";

export function getDefaultTheme() {
  return getTheme();
}

export function getEditTheme() {
  return createTheme({
    palette: {
      themePrimary: "#006885",
      themeLighterAlt: "#f0f8fa",
      themeLighter: "#c6e3eb",
      themeLight: "#99ccda",
      themeTertiary: "#499eb6",
      themeSecondary: "#127793",
      themeDarkAlt: "#005d77",
      themeDark: "#004f65",
      themeDarker: "#003a4a",
      neutralLighterAlt: "#eee6bc",
      neutralLighter: "#eae2b9",
      neutralLight: "#e1d9b2",
      neutralQuaternaryAlt: "#d1caa5",
      neutralQuaternary: "#c8c19e",
      neutralTertiaryAlt: "#c0b998",
      neutralTertiary: "#595959",
      neutralSecondary: "#373737",
      neutralPrimaryAlt: "#2f2f2f",
      neutralPrimary: "#000000",
      neutralDark: "#151515",
      black: "#0b0b0b",
      white: "#f4ebc0",
    },
  });
}
