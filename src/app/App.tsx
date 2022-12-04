import { ComponentType } from "preact";
import { PATH, shiftPath } from "./utils/path";
import { WindowProps } from "../types";
import AddGame from "./AddGame";
import Main from "./Main";

const windows: Record<string, ComponentType<WindowProps>> = {
  "": Main,
  "add-game": AddGame,
};

function App() {
  const Window = Object.entries(windows).find(([key]) => key === PATH[0])?.[1];
  if (!Window) throw new Error("Invalid path.");

  return <Window path={shiftPath(PATH)} />;
}

export default App;
