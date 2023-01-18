import { Config } from "../types";

const stringifyConfig = (config: Config): string => {
  let result = "";

  if (config.comments) {
    result += config.comments
      .split("\n")
      .map((line) => `#${line}`)
      .join("\n");
    result += "\n\n";
  }

  for (const categoryName in config.categories) {
    result += `[${categoryName}]\n`;

    if (config.categories[categoryName].comments) {
      result += config.categories[categoryName].comments
        .split("\n")
        .map((line) => `#${line}`)
        .join("\n");
      result += "\n\n";
    }

    const padding = Object.keys(config.categories[categoryName].settings).reduce(
      (acc, value) => Math.max(acc, value.length),
      0
    );
    for (const settingName in config.categories[categoryName].settings) {
      result += `${settingName.padEnd(padding)} = ${config.categories[categoryName].settings[settingName]}\n`;
    }
    result += "\n";
  }

  result += "[autoexec]\n";
  result += config.autoexec;

  return result;
};

export default stringifyConfig;
