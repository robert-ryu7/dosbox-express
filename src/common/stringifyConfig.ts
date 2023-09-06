import { Config } from "../types";
import { N } from "./constants";

const stringifyConfig = (config: Config): string => {
  let result = "";

  if (config.comments) {
    result += config.comments
      .split(N)
      .map((line) => `#${line}`)
      .join(N);
    result += N + N;
  }

  for (const categoryName in config.categories) {
    const category = config.categories[categoryName];
    if (!category.comments && Object.keys(category.settings).length === 0) continue;

    result += `[${categoryName}]` + N;

    if (category.comments) {
      result += category.comments
        .split(N)
        .map((line) => `#${line}`)
        .join(N);
      result += N + N;
    }

    const padding = Object.keys(category.settings).reduce((acc, value) => Math.max(acc, value.length), 0);
    for (const settingName in category.settings) {
      result += `${settingName.padEnd(padding)} = ${category.settings[settingName]}` + N;
    }
    result += N;
  }

  result += "[autoexec]" + N;
  result += config.autoexec;

  return result.replaceAll(N, "\r\n");
};

export default stringifyConfig;
