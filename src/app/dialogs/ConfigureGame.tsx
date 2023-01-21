import { useMemo, useState } from "preact/hooks";
import Button from "../../components/Button";
import Dialog from "../../components/Dialog";
import Inset from "../../components/Inset";
import List from "../../components/List";
import Outset from "../../components/Outset";
import Input from "../../components/Input";
import { Config, ConfigCategoryData } from "../../types";
import TextArea from "../../components/TextArea";
import stringifyConfig from "../../common/stringifyConfig";
import { confirm } from "@tauri-apps/api/dialog";
import AddCategory from "./AddCategory";
import AddSetting from "./AddSetting";
import Divider from "../../components/Divider";

type ConfigureGameProps = {
  game: {
    id: number;
    baseConfig: Config;
    gameConfig: Config;
  };
  onHide: () => void;
};

const ConfigureGame = (props: ConfigureGameProps) => {
  const [selection, setSelection] = useState<string[]>([]);
  const [config, setConfig] = useState<Config>(() => JSON.parse(JSON.stringify(props.game.gameConfig)));
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState<boolean>(false);
  const [showAddSettingDialog, setShowAddSettingDialog] = useState<boolean>(false);

  const categories = useMemo<string[]>(() => {
    const set = new Set<string>();
    Object.keys(config.categories).forEach((category) => set.add(category));
    Object.keys(props.game.baseConfig.categories).forEach((category) => set.add(category));
    return [...set];
  }, [props.game.baseConfig, config]);

  const settings = useMemo<string[]>(() => {
    if (!selection[0]) return [];

    const set = new Set<string>();
    Object.keys(config.categories[selection[0]]?.settings ?? {}).forEach((setting) => set.add(setting));
    Object.keys(props.game.baseConfig.categories[selection[0]]?.settings ?? {}).forEach((setting) => set.add(setting));
    return [...set];
  }, [selection[0], props.game.baseConfig, config]);

  return (
    <>
      <Dialog show onHide={props.onHide}>
        <div style="width: 100vw; max-width: calc(100vw - 32px); max-height: calc(100vh - 32px); display: flex; flex-direction: column;">
          <div style="flex: 1 1 auto; display: flex; overflow: hidden;">
            <div style="flex: 0 0 120px; display: flex; flex-direction: column;">
              <Outset style="flex: 1 1 auto; display: flex; flex-direction: column; gap: 4px;">
                <div>Categories</div>
                <Inset style="flex: 1 1 auto;">
                  <List
                    items={categories}
                    getKey={(category) => category}
                    selection={selection[0]}
                    onSelect={(category) => setSelection(category ? [category] : [])}
                  >
                    {(category) => {
                      const isInGameConfig = Object.keys(config.categories).includes(category);
                      const containsDifferences = settings.some((setting) => {
                        const baseValue = props.game.baseConfig.categories[category]?.settings[setting] ?? "";
                        const value = config.categories[category]?.settings[setting] ?? "";
                        return baseValue !== value && value !== "";
                      });

                      return (
                        <span
                          style={{ color: containsDifferences ? "var(--color-front)" : "var(--color-primary-bright)" }}
                        >
                          {isInGameConfig ? "" : "~ "}
                          {category}
                        </span>
                      );
                    }}
                  </List>
                </Inset>
                <div style="flex: 0 0 auto; display: flex; flex-direction: column; gap: 2px;">
                  <Button type="button" onClick={() => setShowAddCategoryDialog(true)}>
                    Add
                  </Button>
                  <Button
                    type="button"
                    disabled={!selection[0] || !Object.keys(config.categories).includes(selection[0])}
                    onClick={async () => {
                      if (!selection[0]) return;

                      const confirmed = await confirm(
                        `Do you want to remove ${selection[0]} category and all its settings from game config?`,
                        { title: "Remove selected category", type: "warning" }
                      );
                      if (confirmed) {
                        setConfig((s) => {
                          const categories = { ...s.categories };
                          delete categories[selection[0]];

                          return { ...s, categories };
                        });
                        setSelection([]);
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </Outset>
            </div>
            <div style="flex: 1 1 auto; display: flex; flex-direction: column;">
              <Outset style="flex: 1 1 auto; display: flex; flex-direction: column; gap: 4px;">
                <div>Category settings</div>
                <Inset style="flex: 1 1 auto;">
                  {selection[0] && (
                    <List
                      items={settings}
                      getKey={(setting) => setting}
                      selection={selection[1]}
                      onSelect={(setting) => setSelection(setting ? [selection[0], setting] : [selection[0]])}
                    >
                      {(setting) => {
                        const isInGameConfig = Object.keys(config.categories[selection[0]]?.settings ?? {}).includes(
                          setting
                        );
                        const baseValue = props.game.baseConfig.categories[selection[0]]?.settings[setting] ?? "";
                        const value = config.categories[selection[0]]?.settings[setting] ?? "";
                        const isDifferent = baseValue !== value && value !== "";

                        return (
                          <span style={{ color: isDifferent ? "var(--color-front)" : "var(--color-primary-bright)" }}>
                            {isInGameConfig ? "" : "~ "}
                            {`${setting} = ${value}`}
                          </span>
                        );
                      }}
                    </List>
                  )}
                </Inset>
                <div style="flex: 0 0 auto; display: flex; justify-content: flex-end; gap: 2px;">
                  <Input
                    style="flex: 1;"
                    name="setting_value"
                    id="setting_value"
                    disabled={!selection[1]}
                    placeholder={props.game.baseConfig.categories[selection[0]]?.settings[selection[1]]}
                    value={config.categories[selection[0]]?.settings[selection[1]] ?? ""}
                    onChange={(event) => {
                      const value = (event.target as HTMLInputElement).value;

                      setConfig((s) => {
                        const categoryData: ConfigCategoryData = s.categories[selection[0]] ?? {
                          comments: "",
                          settings: {},
                        };

                        return {
                          ...s,
                          categories: {
                            ...s.categories,
                            [selection[0]]: {
                              ...categoryData,
                              settings: {
                                ...categoryData.settings,
                                [selection[1]]: value,
                              },
                            },
                          },
                        };
                      });
                    }}
                  />
                  <Divider />
                  <Button type="button" disabled={!selection[0]} onClick={() => setShowAddSettingDialog(true)}>
                    Add
                  </Button>
                  <Button
                    type="button"
                    disabled={!selection[1]}
                    onClick={async () => {
                      if (!selection[1]) return;

                      const confirmed = await confirm(
                        `Do you want to remove ${selection[1]} setting from game config?`,
                        {
                          title: "Remove selected setting",
                          type: "warning",
                        }
                      );
                      if (confirmed) {
                        setConfig((s) => {
                          const settings = { ...s.categories[selection[0]]?.settings };
                          delete settings[selection[1]];

                          return {
                            ...s,
                            categories: {
                              ...s.categories,
                              [selection[0]]: { ...s.categories[selection[0]], settings },
                            },
                          };
                        });
                        setSelection([selection[0]]);
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </Outset>
              <Outset style="flex: 0 0 auto; display: flex; flex-direction: column; gap: 4px;">
                <TextArea
                  rows={5}
                  key={`${selection[0]}.comments`}
                  name={`${selection[0]}.comments`}
                  id={`${selection[0]}.comments`}
                  label="Category comments"
                  value={config.categories[selection[0]]?.comments ?? ""}
                  onChange={(event) => {
                    const value = (event.target as HTMLTextAreaElement).value;
                    setConfig((s) => ({
                      ...s,
                      categories: {
                        ...s.categories,
                        [selection[0]]: { ...s.categories[selection[0]], comments: value },
                      },
                    }));
                  }}
                />
              </Outset>
            </div>
          </div>
          <Outset style="flex: 0 0 auto; display: flex; flex-direction: column; gap: 4px;">
            <TextArea
              rows={5}
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
      <AddCategory
        show={showAddCategoryDialog}
        onHide={() => setShowAddCategoryDialog(false)}
        onSubmit={async (values) => {
          setConfig((s) => {
            const categoryData: ConfigCategoryData = s.categories[values.name] ?? {
              comments: "",
              settings: {},
            };

            return { ...s, categories: { ...s.categories, [values.name]: categoryData } };
          });
          setShowAddCategoryDialog(false);
          setSelection([values.name]);
        }}
      />
      <AddSetting
        show={showAddSettingDialog}
        onHide={() => setShowAddSettingDialog(false)}
        onSubmit={async (values) => {
          setConfig((s) => {
            return {
              ...s,
              categories: {
                ...s.categories,
                [selection[0]]: {
                  ...s.categories[selection[0]],
                  settings: {
                    ...s.categories[selection[0]]?.settings,
                    [values.name]: "",
                  },
                },
              },
            };
          });
          setShowAddSettingDialog(false);
          setSelection([selection[0], values.name]);
        }}
      />
    </>
  );
};

export default ConfigureGame;
