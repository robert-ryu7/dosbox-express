import { Config, ConfigCategoryData } from "../types";
import { N } from "./constants";

const parseConfig = (text: string): Config => {
  const lines = text.replaceAll("\r\n", N).split(N);
  let categoryName = "";
  let comments = "";
  let autoexec: string[] = [];
  const categories: Record<string, ConfigCategoryData> = {};
  for (const line of lines) {
    if (line.startsWith("[") && line.endsWith("]")) {
      categoryName = line.slice(1, -1);
    } else if (categoryName === "autoexec") {
      autoexec.push(line);
    } else if (line.startsWith("#")) {
      if (categoryName) {
        if (!categories[categoryName]) categories[categoryName] = { comments: "", settings: {} };
        categories[categoryName].comments += (categories[categoryName].comments ? N : "") + line.slice(1);
      } else {
        comments += (comments ? N : "") + line.slice(1);
      }
    } else if (line !== "") {
      if (categoryName) {
        if (!categories[categoryName]) categories[categoryName] = { comments: "", settings: {} };
        const [name, value] = line.split("=").map((part) => part.trim());
        categories[categoryName].settings[name] = value;
      }
    }
  }

  return { comments, categories, autoexec: autoexec.join(N) };
};

export default parseConfig;
