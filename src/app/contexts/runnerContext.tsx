import { createContext } from "preact";
import { StateUpdater, useContext } from "preact/hooks";

const runnerContext = createContext<[boolean, StateUpdater<boolean>] | undefined>(undefined);

export default runnerContext;

export const useRunner = () => {
  const ctx = useContext(runnerContext);
  if (ctx === undefined) throw new Error("Context is undefined");

  return ctx;
};
