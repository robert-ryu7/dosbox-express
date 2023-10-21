import { ComponentChildren, createContext } from "preact";
import { useContext, useEffect, useMemo } from "preact/hooks";
import useSWR from "swr";
import * as Yup from "yup";
import * as api from "../common/api";
import { Settings } from "../types";

const SCHEMA: Yup.ObjectSchema<Settings, Yup.AnyObject, Settings> = Yup.object({
  confirmConfigChanges: Yup.bool().defined().default(true),
  useRelativeConfigPathsWhenPossible: Yup.bool().defined().default(true),
  theme: Yup.string().optional().default(""),
  inlineCss: Yup.string().optional().default(""),
  saveEmptyConfigValues: Yup.string().oneOf(["none", "settings", "all"]).optional().default("none"),
  showBaseCategoryCommentsByDefault: Yup.string().oneOf(["always", "never", "auto"]).optional().default("auto"),
});

const saveToFile = async (data: Settings): Promise<Settings> => {
  try {
    const rawData = JSON.stringify(data, null, 2);
    await api.setSettings(rawData);
    return data;
  } catch (error: unknown) {
    throw new Error(`Failed to save settings (${String(error)})`);
  }
};

const loadFromFile = async (): Promise<Settings | null> => {
  try {
    const rawData = await api.getSettings();
    if (rawData === null) return null;
    return await SCHEMA.strict().validate(JSON.parse(rawData));
  } catch (error: unknown) {
    throw new Error(`Failed to load settings (${String(error)})`);
  }
};

const fetcher = async () => {
  const settings = await loadFromFile();
  if (settings === null) return await saveToFile(SCHEMA.getDefault());
  return settings;
};

type SettingsContextValue = { settings: Settings; setSettings: (settings: Settings) => Promise<void> };

const settingsContext = createContext<SettingsContextValue | undefined>(undefined);

type SettingsProviderProps = { children: ComponentChildren };

const SettingsProvider = (props: SettingsProviderProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
    [data, mutate],
  );

  useEffect(() => {
    if (error) void api.error(error).then(() => api.exit(1));
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
