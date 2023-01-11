import { invoke } from "@tauri-apps/api";
import { ComponentChildren, createContext } from "preact";
import { useContext, useLayoutEffect, useState } from "preact/hooks";
import runningGamesChangedSubscription from "../../subscription/runningGamesChangedSubscription";

type Value = number[];

const context = createContext<Value | undefined>(undefined);

type RunningGamesProviderProps = {
  children: ComponentChildren;
};

const RunningGamesProvider = (props: RunningGamesProviderProps) => {
  const [value, setValue] = useState<Value>([]);

  useLayoutEffect(() => {
    invoke<number[]>("get_running_games").then(setValue);

    return runningGamesChangedSubscription.subscribe(setValue);
  }, []);

  return <context.Provider value={value}>{props.children}</context.Provider>;
};

export default RunningGamesProvider;

export const useRunningGames = () => {
  const ctx = useContext(context);
  if (ctx === undefined) throw new Error("Context is undefined");

  return ctx;
};
