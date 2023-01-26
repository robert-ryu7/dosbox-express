import { createContext } from "preact";
import { useContext } from "preact/hooks";
import { Setting } from "../../types";

const settingsContext = createContext<Setting[] | undefined>(undefined);

export default settingsContext;

export const useSettings = () => {
  const ctx = useContext(settingsContext);
  if (ctx === undefined) throw new Error("Context is undefined");

  return ctx;
};
