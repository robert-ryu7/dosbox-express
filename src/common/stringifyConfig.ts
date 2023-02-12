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
    result += `[${categoryName}]` + N;

    if (config.categories[categoryName].comments) {
      result += config.categories[categoryName].comments
        .split(N)
        .map((line) => `#${line}`)
        .join(N);
      result += N + N;
    }

    const padding = Object.keys(config.categories[categoryName].settings).reduce(
      (acc, value) => Math.max(acc, value.length),
      0
    );
    for (const settingName in config.categories[categoryName].settings) {
      result += `${settingName.padEnd(padding)} = ${config.categories[categoryName].settings[settingName]}` + N;
    }
    result += N;
  }

  result += "[autoexec]" + N;
  result += config.autoexec;

  return result;
};

export default stringifyConfig;
