import { Config } from "../types";
import parseConfig from "../common/parseConfig";
import { invoke } from "@tauri-apps/api";

const fetchGameConfig = async (id: number): Promise<Config> => {
  const fileContents = await invoke<string>("get_game_config", { id });

  return parseConfig(fileContents);
};

export default fetchGameConfig;
