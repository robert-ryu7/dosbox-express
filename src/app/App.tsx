import { ComponentType } from "preact";
import { PATH, shiftPath } from "./utils/path";
import { WindowProps } from "../types";
import Main from "./windows/Main";
import RunningGamesProvider from "./providers/RunningGamesProvider";

const windows: Record<string, ComponentType<WindowProps>> = {
  "": Main,
};

function App() {
  const Window = Object.entries(windows).find(([key]) => key === PATH[0])?.[1];
  if (!Window) throw new Error("Invalid path.");

  return (
    <RunningGamesProvider>
      <Window path={shiftPath(PATH)} />
    </RunningGamesProvider>
  );
}

export default App;
