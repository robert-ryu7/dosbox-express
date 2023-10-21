import { ComponentChildren } from "preact";
import { useMemo, useState } from "preact/hooks";
import * as api from "../../common/api";
import Config from "../../common/Config";
import pass from "../../common/pass";
import Button from "../../components/Button";
import Checkbox from "../../components/Checkbox";
import Dialog from "../../components/Dialog";
import Divider from "../../components/Divider";
import Input from "../../components/Input";
import Inset from "../../components/Inset";
import List from "../../components/List";
import Outset from "../../components/Outset";
import OutsetHead from "../../components/OutsetHead";
import TextArea from "../../components/TextArea";
import { useSettings } from "../SettingsProvider";
import AddCategoryDialog from "./AddCategoryDialog";
import AddSettingDialog from "./AddSettingDialog";
import ConfigConfirmationDialog from "./ConfigConfirmationDialog";

type CategoryCommentsBlockProps = {
  children: (value: string) => ComponentChildren;
  value: string;
  baseValue: string;
};

const CategoryCommentsBlock = (props: CategoryCommentsBlockProps) => {
  const { settings } = useSettings();
  const [showBaseCategoryComments, setShowBaseCategoryComments] = useState<boolean>(() => {
    switch (settings.showBaseCategoryCommentsByDefault) {
      case "always":
        return true;
      case "never":
        return false;
      case "auto":
        return !props.value;
    }
  });

  const handleCategoryTypeChange = (event: JSX.TargetedEvent<HTMLInputElement>) => {
    setShowBaseCategoryComments(event.currentTarget.checked);
  };

  return (
    <Outset style="flex: 0 0 auto; display: flex; flex-direction: column; gap: 4px;">
      {showBaseCategoryComments ? (
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <div>Base category comments</div>
          <Inset style="height: 72px;">{props.baseValue}</Inset>
        </div>
      ) : (
        props.children(props.value)
      )}
      <Checkbox
        id="showBaseCategoryComments"
        label="Show base category comments"
        checked={showBaseCategoryComments}
        onChange={handleCategoryTypeChange}
      />
    </Outset>
  );
};

const resolveCategorySettings = (config: Config, baseConfig: Config, categoryKey: string) => {
  const set = new Set<string>();
  config.getCategoryKeys(categoryKey)?.forEach((setting) => set.add(setting));
  baseConfig.getCategoryKeys(categoryKey)?.forEach((setting) => set.add(setting));
  return [...set];
};

type ConfigDialogProps = {
  id: number;
  cfg: string;
  baseCfg: string;
  onHide: () => void;
};

const ConfigDialog = (props: ConfigDialogProps) => {
  const { settings } = useSettings();
  const config = useMemo(() => Config.parse(props.cfg), [props.cfg]);
  const baseConfig = useMemo(() => Config.parse(props.baseCfg), [props.baseCfg]);
  const [modifiedConfig, setModifiedConfig] = useState<Config>(() => config.clone());
  const [addCategoryDialog, setAddCategoryDialog] = useState<boolean>(false);
  const [addSettingDialog, setAddSettingDialog] = useState<boolean>(false);
  const [configConfirmationDialog, setConfigConfirmationDialog] = useState<string | null>(null);
  const [selection, setSelection] = useState<string[]>([]);

  const categories = useMemo<string[]>(() => {
    const set = new Set<string>();
    modifiedConfig.keys.forEach((category) => set.add(category));
    baseConfig.keys.forEach((category) => set.add(category));
    return [...set];
  }, [baseConfig, modifiedConfig]);

  const saveChanges = async (config: string) => {
    try {
      await api.updateGameConfig(props.id, config);
      props.onHide();
    } catch (error) {
      await api.error(error);
    }
  };

  const handleCategoryRemove = async () => {
    if (!selection[0]) return;

    const confirmed = await api.confirm(
      `Do you want to remove ${selection[0]} category and all its settings from game config?`,
      { title: "Remove selected category", type: "warning" },
    );
    if (confirmed) {
      setModifiedConfig((s) => {
        const config = s.clone();
        config.deleteCategory(selection[0]);

        return config;
      });
      setSelection([]);
    }
  };

  const handleSettingRemove = async () => {
    if (!selection[1]) return;

    const confirmed = await api.confirm(`Do you want to remove ${selection[1]} setting from game config?`, {
      title: "Remove selected setting",
      type: "warning",
    });
    if (confirmed) {
      setModifiedConfig((s) => {
        const config = s.clone();
        config.deleteCategorySetting(selection[0], selection[1]);

        return config;
      });
      setSelection([selection[0]]);
    }
  };

  const handleSubmit = async () => {
    if (settings.confirmConfigChanges) {
      setConfigConfirmationDialog(Config.stringify(modifiedConfig, { allowEmpty: settings.saveEmptyConfigValues }));
    } else {
      await saveChanges(Config.stringify(modifiedConfig, { allowEmpty: settings.saveEmptyConfigValues }));
    }
  };

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
                  getKey={pass}
                  selection={selection[0]}
                  onSelect={(categoryKey) => setSelection(categoryKey ? [categoryKey] : [])}
                >
                  {(categoryKey) => {
                    const isInModifiedConfig = modifiedConfig.keys.includes(categoryKey);
                    const containsDifferences = resolveCategorySettings(modifiedConfig, baseConfig, categoryKey).some(
                      (settingKey) => {
                        const baseValue = baseConfig.getCategorySetting(categoryKey, settingKey) ?? "";
                        const value = modifiedConfig.getCategorySetting(categoryKey, settingKey) ?? "";
                        return baseValue !== value && value !== "";
                      },
                    );

                    return (
                      <span style={{ color: containsDifferences ? "var(--color-front)" : "var(--color-front-alt)" }}>
                        {isInModifiedConfig ? "" : "~ "}
                        {categoryKey}
                      </span>
                    );
                  }}
                </List>
                <div style="flex: 0 0 auto; display: flex; flex-direction: column; gap: 2px;">
                  <Button onClick={() => setAddCategoryDialog(true)}>Add</Button>
                  <Button
                    disabled={!selection[0] || !modifiedConfig.keys.includes(selection[0])}
                    onClick={handleCategoryRemove}
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
                  items={selection[0] ? resolveCategorySettings(modifiedConfig, baseConfig, selection[0]) : []}
                  getKey={pass}
                  selection={selection[1] ?? null}
                  onSelect={(setting) => setSelection(setting ? [selection[0], setting] : [selection[0]])}
                >
                  {(settingKey) => {
                    const isInModifiedConfig = modifiedConfig.getCategoryKeys(selection[0])?.includes(settingKey);
                    const baseValue = baseConfig.getCategorySetting(selection[0], settingKey) ?? "";
                    const value = modifiedConfig.getCategorySetting(selection[0], settingKey) ?? "";
                    const isDifferent = baseValue !== value && value !== "";

                    return (
                      <span style={{ color: isDifferent ? "var(--color-front)" : "var(--color-front-alt)" }}>
                        {isInModifiedConfig ? "" : "~ "}
                        {`${settingKey} = ${value}`}
                      </span>
                    );
                  }}
                </List>
                <div style="flex: 0 0 auto; display: flex; justify-content: flex-end; gap: 2px;">
                  <Input
                    style="flex: 1;"
                    name="setting_value"
                    id="setting_value"
                    disabled={!selection[1]}
                    placeholder={baseConfig.getCategorySetting(selection[0], selection[1])}
                    value={modifiedConfig.getCategorySetting(selection[0], selection[1]) ?? ""}
                    onChange={(event) => {
                      const value = (event.target as HTMLInputElement).value;

                      setModifiedConfig((s) => {
                        const config = s.clone();
                        config.setCategorySetting(selection[0], selection[1], value);

                        return config;
                      });
                    }}
                  />
                  <Divider />
                  <Button disabled={!selection[0]} onClick={() => setAddSettingDialog(true)}>
                    Add
                  </Button>
                  <Button disabled={!selection[1]} onClick={handleSettingRemove}>
                    Remove
                  </Button>
                </div>
              </Outset>
              <CategoryCommentsBlock
                key={`${selection[0]}.comments`}
                value={modifiedConfig.getCategoryComments(selection[0]) ?? ""}
                baseValue={baseConfig.getCategoryComments(selection[0]) ?? ""}
              >
                {(value) => (
                  <TextArea
                    rows={6}
                    name={`${selection[0]}.comments`}
                    textareaId={`${selection[0]}.comments`}
                    label="Category comments"
                    value={value}
                    onChange={(event) => {
                      const value = (event.target as HTMLTextAreaElement).value;
                      setModifiedConfig((s) => {
                        const config = s.clone();
                        config.setCategoryComments(selection[0], value);

                        return config;
                      });
                    }}
                  />
                )}
              </CategoryCommentsBlock>
            </div>
          </div>
          <Outset style="flex: 0 0 auto; display: flex; flex-direction: column; gap: 4px;">
            <TextArea
              rows={6}
              name="autoexec"
              textareaId="autoexec"
              label="Autoexec"
              value={modifiedConfig.autoexec}
              onChange={(event) => {
                setModifiedConfig((s) => {
                  const config = s.clone();
                  config.autoexec = (event.target as HTMLTextAreaElement).value;

                  return config;
                });
              }}
            />
          </Outset>
          <Outset style="flex: 0 0 auto; display: flex; justify-content: flex-end; gap: 2px;">
            <Button onClick={props.onHide}>Cancel</Button>
            <Button onClick={handleSubmit}>OK</Button>
          </Outset>
        </div>
      </Dialog>
      {addCategoryDialog && (
        <AddCategoryDialog
          onHide={() => setAddCategoryDialog(false)}
          onSubmit={(values) => {
            setModifiedConfig((s) => {
              const config = s.clone();
              config.setCategory(values.name);

              return config;
            });
            setAddCategoryDialog(false);
            setSelection([values.name]);
          }}
        />
      )}
      {addSettingDialog && (
        <AddSettingDialog
          onHide={() => setAddSettingDialog(false)}
          onSubmit={(values) => {
            setModifiedConfig((s) => {
              const config = s.clone();
              config.setCategorySetting(selection[0], values.name, "");

              return config;
            });
            setAddSettingDialog(false);
            setSelection([selection[0], values.name]);
          }}
        />
      )}
      {!!configConfirmationDialog && (
        <ConfigConfirmationDialog
          left={props.cfg}
          right={configConfirmationDialog}
          onHide={() => setConfigConfirmationDialog(null)}
          onConfirm={async (config) => {
            setConfigConfirmationDialog(null);
            await saveChanges(config);
          }}
        />
      )}
    </>
  );
};

export default ConfigDialog;
