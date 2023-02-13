import { ComponentType } from "preact";
import { PATH, shiftPath } from "../common/path";
import { Setting, WindowProps } from "../types";
import Main from "./windows/Main";
import runningGamesContext from "./contexts/runningGamesContext";
import settingsContext from "./contexts/settingsContext";
import { invoke } from "@tauri-apps/api";
import { useState, useLayoutEffect } from "preact/hooks";
import settingsChangedSubscription from "../subscription/settingsChangedSubscription";
import runningGamesChangedSubscription from "../subscription/runningGamesChangedSubscription";
import { DEFAULT_BUTTON_SHADES, DEFAULT_PRIMARY_SHADES, getContrast, getShades, normalizeColor } from "../common/theme";
import runnerContext from "./contexts/runnerContext";

const windows: Record<string, ComponentType<WindowProps>> = {
  "": Main,
};

function App() {
  const Window = Object.entries(windows).find(([key]) => key === PATH[0])?.[1];
  if (!Window) throw new Error("Invalid path.");

  const [settings, setSettings] = useState<Setting[]>();

  useLayoutEffect(() => {
    invoke<Setting[]>("get_settings").then(setSettings);

    return settingsChangedSubscription.subscribe(setSettings);
  }, []);

  const runnerContextValue = useState<boolean>(false);
  const [runningGames, setRunningGames] = useState<number[]>();

  useLayoutEffect(() => {
    invoke<number[]>("get_running_games").then(setRunningGames);

    return runningGamesChangedSubscription.subscribe(setRunningGames);
  }, []);

  if (settings === undefined || runningGames === undefined) return null;

  useLayoutEffect(() => {
    const findColor = (key: string) => {
      const color = settings.find((setting) => setting.key === key)?.value;

      return color ? normalizeColor(color) : null;
    };
    const root = document.body;

    const primaryColorsBase = findColor("primaryColor");
    const primaryColors = primaryColorsBase ? getShades(primaryColorsBase, DEFAULT_PRIMARY_SHADES) : undefined;
    root.style.setProperty("--color-primary", primaryColors?.base ?? null);
    root.style.setProperty("--color-primary-bright", primaryColors?.bright ?? null);
    root.style.setProperty("--color-primary-dark", primaryColors?.dark ?? null);
    root.style.setProperty("--color-primary-darker", primaryColors?.darker ?? null);
    root.style.setProperty("--color-primary-contrast", primaryColorsBase ? getContrast(primaryColorsBase) : null);

    const buttonColorsBase = findColor("buttonColor");
    const buttonColors = buttonColorsBase ? getShades(buttonColorsBase, DEFAULT_BUTTON_SHADES) : undefined;
    root.style.setProperty("--color-button", buttonColors?.base ?? null);
    root.style.setProperty("--color-button-bright", buttonColors?.bright ?? null);
    root.style.setProperty("--color-button-dark", buttonColors?.dark ?? null);
    root.style.setProperty("--color-button-darker", buttonColors?.darker ?? null);
    root.style.setProperty("--color-button-contrast", buttonColorsBase ? getContrast(buttonColorsBase) : null);
    root.style.setProperty("--color-button-disabled", buttonColors?.disabled ?? null);
    root.style.setProperty("--color-button-disabled-bright", buttonColors?.disabledBright ?? null);
    root.style.setProperty("--color-button-disabled-dark", buttonColors?.disabledDark ?? null);
    root.style.setProperty("--color-button-disabled-darker", buttonColors?.disabledDarker ?? null);

    root.style.setProperty("--color-scrollbar", findColor("scrollbarColor"));
    root.style.setProperty("--color-front", findColor("frontColor"));
    root.style.setProperty("--color-front-alt", findColor("frontAltColor"));
    root.style.setProperty("--color-back", findColor("backColor"));
    root.style.setProperty("--color-back-bright", findColor("backBrightColor"));
    root.style.setProperty("--color-back-brighter", findColor("backBrighterColor"));
    root.style.setProperty("--color-input-placeholder", findColor("inputPlaceholderColor"));
    root.style.setProperty("--color-input-disabled-bg", findColor("inputDisabledBgColor"));
  }, [settings]);

  return (
    <settingsContext.Provider value={settings}>
      <runnerContext.Provider value={runnerContextValue}>
        <runningGamesContext.Provider value={runningGames}>
          <Window path={shiftPath(PATH)} />
        </runningGamesContext.Provider>
      </runnerContext.Provider>
    </settingsContext.Provider>
  );
}

export default App;
