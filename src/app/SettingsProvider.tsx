import useSWR from "swr";
import { ComponentChildren, createContext } from "preact";
import { readTextFile, exists, writeTextFile, BaseDirectory } from "@tauri-apps/api/fs";
import { exit } from "@tauri-apps/api/process";
import { message } from "@tauri-apps/api/dialog";
import * as Yup from "yup";
import { Settings } from "../types";
import { useContext, useEffect, useMemo } from "preact/hooks";

const FILE_PATH = "settings.json";

const SCHEMA: Yup.ObjectSchema<Settings> = Yup.object({
  confirmConfigChanges: Yup.bool().defined().default(true),
  useRelativeConfigPathsWhenPossible: Yup.bool().defined().default(true),
  theme: Yup.string().optional().default(""),
  inlineCss: Yup.string().optional().default(""),
  saveEmptyConfigValues: Yup.string().oneOf(["none", "settings", "all"]).optional().default("none"),
  showBaseCategoryCommentsByDefault: Yup.string().oneOf(["always", "never", "auto"]).optional().default("auto"),
});

const saveToFile = async (data: Settings): Promise<void> => {
  try {
    const rawData = JSON.stringify(data, null, 2);
    await writeTextFile(FILE_PATH, rawData, { dir: BaseDirectory.Resource });
  } catch (err: unknown) {
    throw new Error(`Failed to save settings (${err})`);
  }
};

const loadFromFile = async (): Promise<Settings> => {
  try {
    const rawData = await readTextFile(FILE_PATH, { dir: BaseDirectory.Resource });
    return await SCHEMA.strict().validate(JSON.parse(rawData));
  } catch (err: unknown) {
    throw new Error(`Failed to load settings (${err})`);
  }
};

const fetcher = async () => {
  if (!(await exists(FILE_PATH, { dir: BaseDirectory.Resource }))) {
    await saveToFile(SCHEMA.getDefault());
  }

  return await loadFromFile();
};

type SettingsContextValue = { settings: Settings; setSettings: (settings: Settings) => Promise<void> };

const settingsContext = createContext<SettingsContextValue | undefined>(undefined);

type SettingsProviderProps = { children: ComponentChildren };

const SettingsProvider = (props: SettingsProviderProps) => {
  const { data, error, isLoading, mutate } = useSWR("settings", fetcher);

  const value = useMemo<SettingsContextValue | undefined>(
    () =>
      data && {
        settings: data,
        setSettings: async (settings) => {
          await saveToFile(settings);
          await mutate(settings);
        },
      },
    [data, mutate]
  );

  useEffect(() => {
    if (error) message(String(error), { type: "error" }).then(() => exit(1));
  }, [error]);

  if (!value || error || isLoading) return null;

  return <settingsContext.Provider value={value}>{props.children}</settingsContext.Provider>;
};

export default SettingsProvider;

export const useSettings = () => {
  const ctx = useContext(settingsContext);
  if (ctx === undefined) throw new Error("Context is undefined");

  return ctx;
};
