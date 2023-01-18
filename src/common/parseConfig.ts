import { Config, ConfigCategoryData } from "../types";

const parseConfig = (text: string): Config => {
  const lines = text.split("\r\n").filter((line) => line !== "");
  let categoryName = "";
  let comments = "";
  let autoexec = "";
  const categories: Record<string, ConfigCategoryData> = {};
  for (const line of lines) {
    if (line.startsWith("[") && line.endsWith("]")) {
      categoryName = line.slice(1, -1);
    } else if (categoryName === "autoexec") {
      autoexec += line + "\n";
    } else if (line.startsWith("#")) {
      if (categoryName) {
        if (!categories[categoryName]) categories[categoryName] = { comments: "", settings: {} };
        categories[categoryName].comments += (categories[categoryName].comments ? "\n" : "") + line.slice(1);
      } else {
        comments += (comments ? "\n" : "") + line.slice(1);
      }
    } else {
      if (categoryName) {
        if (!categories[categoryName]) categories[categoryName] = { comments: "", settings: {} };
        const [name, value] = line.split("=").map((part) => part.trim());
        categories[categoryName].settings[name] = value;
      }
    }
  }

  return { comments, categories, autoexec };
};

export default parseConfig;
