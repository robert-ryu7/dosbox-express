import { invoke } from "@tauri-apps/api";

const fetchGameConfig = async (id: number): Promise<string> => {
  const fileContents = await invoke<string>("get_game_config", { id });

  return fileContents;
};

export default fetchGameConfig;
