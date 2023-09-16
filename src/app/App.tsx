import { ComponentType, Fragment } from "preact";
import { PATH } from "../common/path";
import Main from "./windows/Main";
import runningGamesContext from "./contexts/runningGamesContext";
import { invoke } from "@tauri-apps/api";
import { useState, useLayoutEffect } from "preact/hooks";
import runningGamesChangedSubscription from "../subscription/runningGamesChangedSubscription";
import runnerContext from "./contexts/runnerContext";
import Styles from "./Styles";
import SettingsProvider from "./SettingsProvider";

const windows: Record<string, ComponentType> = {
  "": Main,
};

function App() {
  const Window = Object.entries(windows).find(([key]) => key === PATH[0])?.[1];
  if (!Window) throw new Error("Invalid path.");

  const runnerContextValue = useState<boolean>(false);
  const [runningGames, setRunningGames] = useState<number[]>();

  useLayoutEffect(() => {
    invoke<number[]>("get_running_games").then(setRunningGames);

    return runningGamesChangedSubscription.subscribe(setRunningGames);
  }, []);

  if (runningGames === undefined) return null;

  return (
    <SettingsProvider>
      <Styles />
      <runnerContext.Provider value={runnerContextValue}>
        <runningGamesContext.Provider value={runningGames}>
          <Window />
        </runningGamesContext.Provider>
      </runnerContext.Provider>
    </SettingsProvider>
  );
}

export default App;
