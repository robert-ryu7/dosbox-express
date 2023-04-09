import { invoke } from "@tauri-apps/api";

const fetchDefaultConfig = async (): Promise<string> => {
  const fileContents = await invoke<string>("get_default_config");

  return fileContents;
};

export default fetchDefaultConfig;
