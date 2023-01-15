export type Game = {
  id: number;
  title: string;
  config_path: string;
};

export type WindowProps = {
  path: string[];
};

export type ConfigSettingData = string;
export type ConfigCategoryData = { comments: string; settings: Record<string, ConfigSettingData> };
export type Config = { comments: string; categories: Record<string, ConfigCategoryData>; autoexec: string };