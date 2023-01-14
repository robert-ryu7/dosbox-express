import { resolveResource } from "@tauri-apps/api/path";
import { readTextFile } from "@tauri-apps/api/fs";
import { useEffect, useState } from "preact/hooks";

type Setting = { name: string; value: string };
type CategoryData = { comments: string; settings: Setting[] };

const useBaseConfig = () => {
  const [baseConfig, setBaseConfig] = useState<Record<string, CategoryData>>();

  useEffect(() => {
    resolveResource("base.conf")
      .then((resourcePath) => readTextFile(resourcePath))
      .then((text) => {
        const lines = text
          .split("\r\n")
          .filter((line) => line !== "")
          .map((line) => line.trim());
        let categoryName = "";
        const result: Record<string, CategoryData> = {};
        for (const line of lines) {
          if (line.startsWith("[") && line.endsWith("]")) {
            categoryName = line.slice(1, -1);
          } else if (line.startsWith("#")) {
            if (!result[categoryName]) result[categoryName] = { comments: "", settings: [] };
            result[categoryName].comments += (result[categoryName].comments ? "\n" : "") + line.slice(1);
          } else {
            if (!result[categoryName]) result[categoryName] = { comments: "", settings: [] };
            const [name, value] = line.split("=").map((part) => part.trim());
            result[categoryName].settings.push({ name, value });
          }
        }
        setBaseConfig(result);
      });
  }, []);

  return baseConfig;
};

export default useBaseConfig;
