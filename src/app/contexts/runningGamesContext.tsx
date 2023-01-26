import { createContext } from "preact";
import { useContext } from "preact/hooks";

const runningGamesContext = createContext<number[] | undefined>(undefined);

export default runningGamesContext;

export const useRunningGames = () => {
  const ctx = useContext(runningGamesContext);
  if (ctx === undefined) throw new Error("Context is undefined");

  return ctx;
};
