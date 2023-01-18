import { useMemo, useState } from "preact/hooks";
import Button from "../../components/Button";
import Dialog from "../../components/Dialog";
import Inset from "../../components/Inset";
import List from "../../components/List";
import Outset from "../../components/Outset";
import Input from "../../components/Input";
import { Config } from "../../types";
import TextArea from "../../components/TextArea";
import stringifyConfig from "../../common/stringifyConfig";

type ConfigureGameProps = {
  game: {
    id: number;
    baseConfig: Config;
    gameConfig: Config;
  };
  onHide: () => void;
};

const getSettingPlaceholder = (setting: string | null, baseConfig: Config): string | undefined => {
  if (setting === null) return undefined;

  const [category, name] = setting.split(".");

  return baseConfig.categories[category]?.settings[name];
};

const getSettingValue = (setting: string | null, config: Config): string | undefined => {
  if (setting === null) return undefined;

  const [category, name] = setting.split(".");

  return config.categories[category]?.settings[name];
};

const ConfigureGame = (props: ConfigureGameProps) => {
  const [config, setConfig] = useState<Config>(() => JSON.parse(JSON.stringify(props.game.gameConfig)));
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSetting, setSelectedSetting] = useState<string | null>(null);

  const categories = useMemo<string[]>(() => {
    const set = new Set<string>();
    Object.keys(config.categories).forEach((category) => set.add(category));
    Object.keys(props.game.baseConfig.categories).forEach((category) => set.add(category));
    return [...set];
  }, [props.game.baseConfig, config]);

  const settings = useMemo<string[]>(() => {
    const set = new Set<string>();
    for (const category of categories) {
      Object.keys(config.categories[category]?.settings ?? {}).forEach((setting) =>
        set.add([category, setting].join("."))
      );
      Object.keys(props.game.baseConfig.categories[category]?.settings ?? {}).forEach((setting) =>
        set.add([category, setting].join("."))
      );
    }
    return [...set];
  }, [categories, props.game.baseConfig, config]);

  return (
    <Dialog show onHide={props.onHide}>
      <div style="max-height: calc(100vh - 32px); display: flex; flex-direction: column;">
        <div style="flex: 1 1 auto; display: flex; overflow: hidden;">
          <Outset style="min-width: 120px; flex: 0 0 auto; display: flex; flex-direction: column; gap: 8px;">
            <Inset style="flex: 1 1 auto;">
              <List
                items={categories}
                getKey={(item) => item}
                selection={selectedCategory}
                onSelect={setSelectedCategory}
              >
                {(item) => {
                  const containsDifferences = settings
                    .filter((setting) => setting.split(".")[0] === item)
                    .some((setting) => {
                      const name = setting.split(".")[1];
                      const baseValue = props.game.baseConfig.categories[item]?.settings[name] ?? "";
                      const value = config.categories[item]?.settings[name] ?? "";
                      return baseValue !== value && value !== "";
                    });

                  return (
                    <span style={{ color: containsDifferences ? "var(--color-front)" : "var(--color-primary-bright)" }}>
                      {item}
                    </span>
                  );
                }}
              </List>
            </Inset>
          </Outset>
          <div style="min-width: 340px; flex: 1 1 auto; display: flex; flex-direction: column;">
            <Outset style="flex: 1 1 auto; display: flex; flex-direction: column; gap: 8px;">
              <Inset style="flex: 1 1 auto;">
                {selectedCategory && (
                  <List
                    items={settings.filter((setting) => setting.split(".")[0] === selectedCategory)}
                    getKey={(item) => item}
                    selection={selectedSetting}
                    onSelect={setSelectedSetting}
                  >
                    {(item) => {
                      const [category, setting] = item.split(".");
                      const baseValue = props.game.baseConfig.categories[category]?.settings[setting] ?? "";
                      const value = config.categories[category]?.settings[setting] ?? "";
                      const isDifferent = baseValue !== value && value !== "";

                      return (
                        <span style={{ color: isDifferent ? "var(--color-front)" : "var(--color-primary-bright)" }}>
                          {`${setting} = ${value}`}
                        </span>
                      );
                    }}
                  </List>
                )}
              </Inset>
            </Outset>
            <Outset style="flex: 0 0 auto; display: flex; flex-direction: column; gap: 8px;">
              <Input
                name="setting_value"
                id="setting_value"
                label={`Selected setting value (${selectedSetting ?? "none"})`}
                disabled={!selectedSetting}
                placeholder={getSettingPlaceholder(selectedSetting, props.game.baseConfig)}
                value={getSettingValue(selectedSetting, config)}
                onChange={
                  selectedSetting
                    ? (event) => {
                        const [category, name] = selectedSetting.split(".");

                        setConfig((s) => ({
                          ...s,
                          categories: {
                            ...s.categories,
                            [category]: {
                              ...s.categories[category],
                              settings: {
                                ...s.categories[category].settings,
                                [name]: (event.target as HTMLInputElement).value,
                              },
                            },
                          },
                        }));
                      }
                    : undefined
                }
              />
            </Outset>
          </div>
        </div>
        <Outset style="flex: 0 0 auto; display: flex; flex-direction: column; gap: 4px;">
          <TextArea
            name="autoexec"
            id="autoexec"
            label="Autoexec"
            value={config.autoexec}
            onChange={(event) => {
              setConfig((s) => ({ ...s, autoexec: (event.target as HTMLTextAreaElement).value }));
            }}
          />
        </Outset>
        <Outset style="flex: 0 0 auto; display: flex; justify-content: flex-end; gap: 2px;">
          <Button type="button" onClick={() => props.onHide()}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(stringifyConfig(config));
              console.log(stringifyConfig(config));
            }}
          >
            OK
          </Button>
        </Outset>
      </div>
    </Dialog>
  );
};

export default ConfigureGame;
