import { useMemo, useState } from "preact/hooks";
import Button from "../../components/Button";
import Dialog from "../../components/Dialog";
import Inset from "../../components/Inset";
import List from "../../components/List";
import Outset from "../../components/Outset";
import Input from "../../components/Input";
import TextArea from "../../components/TextArea";
import { confirm } from "@tauri-apps/api/dialog";
import AddCategory from "./AddCategory";
import AddSetting from "./AddSetting";
import Divider from "../../components/Divider";
import ConfigChangesConfirmation from "./ConfigChangesConfirmation";
import OutsetHead from "../../components/OutsetHead";
import { invoke } from "@tauri-apps/api";
import Checkbox from "../../components/Checkbox";
import attempt from "../../common/attempt";
import { useSettings } from "../SettingsProvider";
import Config from "../../common/Config";

type ConfigureGameProps = {
  id: number;
  baseConfig: string;
  gameConfig: string;
  onHide: () => void;
};

const resolveCategorySettings = (config: Config, baseConfig: Config, categoryKey: string) => {
  const set = new Set<string>();
  config.getCategoryKeys(categoryKey)?.forEach((setting) => set.add(setting));
  baseConfig.getCategoryKeys(categoryKey)?.forEach((setting) => set.add(setting));
  return [...set];
};

const ConfigureGame = (props: ConfigureGameProps) => {
  const { settings } = useSettings();
  const baseConfig = useMemo(() => Config.parse(props.baseConfig), [props.baseConfig]);
  const gameConfig = useMemo(() => Config.parse(props.gameConfig), [props.gameConfig]);
  const [selection, setSelection] = useState<string[]>([]);
  const [config, setConfig] = useState<Config>(() => gameConfig.clone());
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState<boolean>(false);
  const [showAddSettingDialog, setShowAddSettingDialog] = useState<boolean>(false);
  const [showBaseCategoryComments, setShowBaseCategoryComments] = useState<boolean>(false);
  const [confirmationValue, setConfirmationValue] = useState<string | null>(null);

  const categories = useMemo<string[]>(() => {
    const set = new Set<string>();
    config.keys.forEach((category) => set.add(category));
    baseConfig.keys.forEach((category) => set.add(category));
    return [...set];
  }, [baseConfig, config]);

  const saveChanges = attempt(async (config: string) => {
    await invoke("update_game_config", { id: props.id, config });
    props.onHide();
  });

  return (
    <>
      <Dialog show onHide={props.onHide}>
        <div style="width: calc(100vw - 32px); height: calc(100vh - 32px); display: flex; flex-direction: column;">
          <div style="flex: 1 1 auto; display: flex; overflow: hidden;">
            <div style="flex: 0 0 120px; display: flex; flex-direction: column;">
              <Outset style="flex: 1 1 auto; display: flex; flex-direction: column; gap: 4px;">
                <OutsetHead>Categories</OutsetHead>
                <List
                  style="flex: 1 1 auto;"
                  items={categories}
                  getKey={(categoryKey) => categoryKey}
                  selection={selection[0]}
                  onSelect={(categoryKey) => setSelection(categoryKey ? [categoryKey] : [])}
                >
                  {(categoryKey) => {
                    const isInGameConfig = config.keys.includes(categoryKey);
                    const containsDifferences = resolveCategorySettings(config, baseConfig, categoryKey).some(
                      (settingKey) => {
                        const baseValue = baseConfig.getCategorySetting(categoryKey, settingKey) ?? "";
                        const value = config.getCategorySetting(categoryKey, settingKey) ?? "";
                        return baseValue !== value && value !== "";
                      }
                    );

                    return (
                      <span style={{ color: containsDifferences ? "var(--color-front)" : "var(--color-front-alt)" }}>
                        {isInGameConfig ? "" : "~ "}
                        {categoryKey}
                      </span>
                    );
                  }}
                </List>
                <div style="flex: 0 0 auto; display: flex; flex-direction: column; gap: 2px;">
                  <Button type="button" onClick={() => setShowAddCategoryDialog(true)}>
                    Add
                  </Button>
                  <Button
                    type="button"
                    disabled={!selection[0] || !config.keys.includes(selection[0])}
                    onClick={async () => {
                      if (!selection[0]) return;

                      const confirmed = await confirm(
                        `Do you want to remove ${selection[0]} category and all its settings from game config?`,
                        { title: "Remove selected category", type: "warning" }
                      );
                      if (confirmed) {
                        setConfig((s) => {
                          const config = s.clone();
                          config.deleteCategory(selection[0]);

                          return config;
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
            <div style="flex: 1 1 auto; overflow: hidden; display: flex; flex-direction: column;">
              <Outset style="flex: 1 1 auto; display: flex; flex-direction: column; gap: 4px;">
                <OutsetHead>Category settings</OutsetHead>
                <List
                  style="flex: 1 1 auto;"
                  items={selection[0] ? resolveCategorySettings(config, baseConfig, selection[0]) : []}
                  getKey={(settingKey) => settingKey}
                  selection={selection[1] ?? null}
                  onSelect={(setting) => setSelection(setting ? [selection[0], setting] : [selection[0]])}
                >
                  {(settingKey) => {
                    const isInGameConfig = config.getCategoryKeys(selection[0])?.includes(settingKey);
                    const baseValue = baseConfig.getCategorySetting(selection[0], settingKey) ?? "";
                    const value = config.getCategorySetting(selection[0], settingKey) ?? "";
                    const isDifferent = baseValue !== value && value !== "";

                    return (
                      <span style={{ color: isDifferent ? "var(--color-front)" : "var(--color-front-alt)" }}>
                        {isInGameConfig ? "" : "~ "}
                        {`${settingKey} = ${value}`}
                      </span>
                    );
                  }}
                </List>
                <div style="flex: 0 0 auto; display: flex; justify-content: flex-end; gap: 2px;">
                  <Input
                    style="flex: 1;"
                    name="setting_value"
                    inputId="setting_value"
                    disabled={!selection[1]}
                    placeholder={baseConfig.getCategorySetting(selection[0], selection[1])}
                    value={config.getCategorySetting(selection[0], selection[1]) ?? ""}
                    onChange={(event) => {
                      const value = (event.target as HTMLInputElement).value;

                      setConfig((s) => {
                        const config = s.clone();
                        config.setCategorySetting(selection[0], selection[1], value);

                        return config;
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
                          const config = s.clone();
                          config.deleteCategorySetting(selection[0], selection[1]);

                          return config;
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
                {showBaseCategoryComments ? (
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                    <div>Base category comments</div>
                    <Inset style="height: 72px;">{baseConfig.getCategoryComments(selection[0])}</Inset>
                  </div>
                ) : (
                  <TextArea
                    rows={6}
                    key={`${selection[0]}.comments`}
                    name={`${selection[0]}.comments`}
                    textareaId={`${selection[0]}.comments`}
                    label="Category comments"
                    value={config.getCategoryComments(selection[0]) ?? ""}
                    onChange={(event) => {
                      const value = (event.target as HTMLTextAreaElement).value;
                      setConfig((s) => {
                        const config = s.clone();
                        config.setCategoryComments(selection[0], value);

                        return config;
                      });
                    }}
                  />
                )}
                <Checkbox
                  inputId="showBaseCategoryComments"
                  label="Show base category comments"
                  checked={showBaseCategoryComments}
                  onChange={(event) => {
                    if (event.target instanceof HTMLInputElement) setShowBaseCategoryComments(event.target.checked);
                  }}
                />
              </Outset>
            </div>
          </div>
          <Outset style="flex: 0 0 auto; display: flex; flex-direction: column; gap: 4px;">
            <TextArea
              rows={6}
              name="autoexec"
              textareaId="autoexec"
              label="Autoexec"
              value={config.autoexec}
              onChange={(event) => {
                setConfig((s) => {
                  const config = s.clone();
                  config.autoexec = (event.target as HTMLTextAreaElement).value;

                  return config;
                });
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
                if (settings.confirmConfigChanges) {
                  setConfirmationValue(Config.stringify(config, { allowEmpty: settings.saveEmptyConfigValues }));
                } else {
                  saveChanges(Config.stringify(config, { allowEmpty: settings.saveEmptyConfigValues }));
                }
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
            const config = s.clone();
            config.setCategory(values.name);

            return config;
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
            const config = s.clone();
            config.setCategorySetting(selection[0], values.name, "");

            return config;
          });
          setShowAddSettingDialog(false);
          setSelection([selection[0], values.name]);
        }}
      />
      {!!confirmationValue && (
        <ConfigChangesConfirmation
          left={props.gameConfig}
          right={confirmationValue}
          onHide={() => setConfirmationValue(null)}
          onConfirm={() => {
            setConfirmationValue(null);
            saveChanges(confirmationValue);
          }}
        />
      )}
    </>
  );
};

export default ConfigureGame;
