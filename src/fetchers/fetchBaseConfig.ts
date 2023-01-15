import { resolveResource } from "@tauri-apps/api/path";
import { readTextFile } from "@tauri-apps/api/fs";
import { Config } from "../types";
import parseConfig from "../common/parseConfig";

const fetchBaseConfig = async (): Promise<Config> => {
  const resourcePath = await resolveResource("base.conf");
  const fileContents = await readTextFile(resourcePath);

  return parseConfig(fileContents);
};

export default fetchBaseConfig;
