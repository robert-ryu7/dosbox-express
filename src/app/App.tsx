import { ComponentType, Fragment } from "preact";
import { PATH } from "../common/path";
import { Setting } from "../types";
import Main from "./windows/Main";
import runningGamesContext from "./contexts/runningGamesContext";
import settingsContext from "./contexts/settingsContext";
import { invoke } from "@tauri-apps/api";
import { useState, useLayoutEffect } from "preact/hooks";
import settingsChangedSubscription from "../subscription/settingsChangedSubscription";
import runningGamesChangedSubscription from "../subscription/runningGamesChangedSubscription";
import runnerContext from "./contexts/runnerContext";
import { readTextFile } from "@tauri-apps/api/fs";
import attempt from "../common/attempt";

const windows: Record<string, ComponentType> = {
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

  const [theme, setTheme] = useState<string>("");

  useLayoutEffect(() => {
    let mounted = true;

    const themePath = settings?.find((setting) => setting.key === "theme")?.value;
    if (themePath) {
      attempt(async () => {
        const theme = await readTextFile(themePath);
        if (mounted) setTheme(theme);
      })();
    }

    return () => {
      mounted = false;
      setTheme("");
    };
  }, [settings]);

  if (settings === undefined || runningGames === undefined) return null;

  const inlineCss = settings.find((setting) => setting.key === "inlineCss")?.value;

  return (
    <Fragment>
      <style type="text/css">{theme}</style>
      {inlineCss && <style type="text/css">{inlineCss}</style>}
      <settingsContext.Provider value={settings}>
        <runnerContext.Provider value={runnerContextValue}>
          <runningGamesContext.Provider value={runningGames}>
            <Window />
          </runningGamesContext.Provider>
        </runnerContext.Provider>
      </settingsContext.Provider>
    </Fragment>
  );
}

export default App;
