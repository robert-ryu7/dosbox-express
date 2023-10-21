import { ComponentType } from "preact";
import { useLayoutEffect, useState } from "preact/hooks";
import * as api from "../common/api";
import { PATH } from "../common/path";
import errorSubscription from "../common/subscriptions/errorSubscription";
import runningGamesChangedSubscription from "../common/subscriptions/runningGamesChangedSubscription";
import runnerContext from "./contexts/runnerContext";
import runningGamesContext from "./contexts/runningGamesContext";
import SettingsProvider from "./SettingsProvider";
import Styles from "./Styles";
import MainWindow from "./windows/MainWindow";

const windows: Record<string, ComponentType> = {
  "": MainWindow,
};

function App() {
  const Window = Object.entries(windows).find(([key]) => key === PATH[0])?.[1];
  if (!Window) throw new Error("Invalid path.");

  const runnerContextValue = useState<boolean>(false);
  const [runningGamesContextValue, setRunningGamesContextValue] = useState<number[]>();

  useLayoutEffect(() => {
    api.getRunningGames().then(setRunningGamesContextValue).catch(api.error);

    return runningGamesChangedSubscription.subscribe(setRunningGamesContextValue);
  }, []);

  useLayoutEffect(() => {
    return errorSubscription.subscribe(async (error) => {
      await api.error(error);
      if (api.isAppError(error) && error.type === "GameRunFailed") {
        try {
          const runningGames = await api.getRunningGames();
          setRunningGamesContextValue(runningGames);
        } catch (error) {
          await api.error(error);
        }
      }
    });
  }, []);

  if (runningGamesContextValue === undefined) return null;

  return (
    <SettingsProvider>
      <Styles />
      <runnerContext.Provider value={runnerContextValue}>
        <runningGamesContext.Provider value={runningGamesContextValue}>
          <Window />
        </runningGamesContext.Provider>
      </runnerContext.Provider>
    </SettingsProvider>
  );
}

export default App;
