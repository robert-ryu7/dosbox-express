import { resolveResource } from "@tauri-apps/api/path";
import { readTextFile } from "@tauri-apps/api/fs";

const fetchBaseConfig = async (): Promise<string> => {
  const resourcePath = await resolveResource("base.conf");
  const fileContents = await readTextFile(resourcePath);

  return fileContents;
};

export default fetchBaseConfig;
