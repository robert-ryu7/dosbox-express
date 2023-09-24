export type Game = {
  id: number;
  title: string;
  config_path: string;
  run_time: number;
};

export type Settings = {
  theme: string;
  inlineCss: string;
  useRelativeConfigPathsWhenPossible: boolean;
  confirmConfigChanges: boolean;
  saveEmptyConfigValues: "none" | "settings" | "all";
  showBaseCategoryCommentsByDefault: "always" | "never" | "auto";
};
