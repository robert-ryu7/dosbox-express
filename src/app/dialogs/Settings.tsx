import Dialog from "../../components/Dialog";
import Outset from "../../components/Outset";
import { useFormik, FormikContext } from "formik";
import * as Yup from "yup";
import Button from "../../components/Button";
import Form from "../../components/formik/Form";
import Checkbox from "../../components/formik/Checkbox";
import { useEffect, useMemo, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api";
import { exists, readDir, BaseDirectory } from "@tauri-apps/api/fs";
import { useSettings } from "../contexts/settingsContext";
import OutsetHead from "../../components/OutsetHead";
import Select from "../../components/formik/Select";
import TextArea from "../../components/formik/TextArea";

type Values = {
  confirmConfigChanges: boolean;
  useRelativeConfigPathsWhenPossible: boolean;
  theme: string | undefined;
  inlineCss: string | undefined;
};

const validationSchema: Yup.SchemaOf<Values> = Yup.object({
  confirmConfigChanges: Yup.bool().label("Confirm config changes").defined(),
  useRelativeConfigPathsWhenPossible: Yup.bool().label("Confirm config changes").defined(),
  theme: Yup.string().label("Theme").optional(),
  inlineCss: Yup.string().label("Inline CSS").optional(),
});

const getThemes = async (): Promise<{ name: string; path: string }[]> => {
  if (await exists("themes", { dir: BaseDirectory.Resource })) {
    const entries = await readDir("themes", { dir: BaseDirectory.Resource, recursive: false });
    return entries
      .filter((entry): entry is { name: string; path: string } => !!entry.name && entry.name.endsWith(".css"))
      .map((entry) => ({ name: entry.name, path: entry.path }));
  }

  return [];
};

type SettingsProps = {
  show: boolean;
  onHide: () => void;
};

const Settings = (props: SettingsProps) => {
  const [themes, setThemes] = useState<{ name: string; path: string }[] | undefined>(undefined);
  useEffect(() => {
    getThemes().then(setThemes);
  }, []);

  const settings = useSettings();
  const initialValues = useMemo<Values>(() => {
    return {
      confirmConfigChanges: settings.find((setting) => setting.key === "confirmConfigChanges")?.value === "1",
      useRelativeConfigPathsWhenPossible:
        settings.find((setting) => setting.key === "useRelativeConfigPathsWhenPossible")?.value === "1",
      theme: settings.find((setting) => setting.key === "theme")?.value ?? "",
      inlineCss: settings.find((setting) => setting.key === "inlineCss")?.value ?? "",
    };
  }, [settings]);
  const formik = useFormik<Values>({
    initialValues,
    validationSchema,
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      await invoke("update_settings", {
        changedSettings: [
          { key: "confirmConfigChanges", value: values.confirmConfigChanges ? "1" : "0" },
          { key: "useRelativeConfigPathsWhenPossible", value: values.useRelativeConfigPathsWhenPossible ? "1" : "0" },
          { key: "theme", value: values.theme },
          { key: "inlineCss", value: values.inlineCss },
        ],
      });
      props.onHide();
    },
  });

  return (
    <Dialog show={props.show} onHide={props.onHide}>
      <FormikContext.Provider value={formik}>
        <Form style="display: flex; flex-direction: column;">
          <Outset style="flex: 0 0 auto; display: flex; flex-direction: column; gap: 8px;">
            <OutsetHead>Visuals</OutsetHead>
            <Select name="theme" selectId="theme" label="Theme">
              <option value="">Default</option>
              {themes?.map((theme) => (
                <option key={theme.path} value={theme.path}>
                  {theme.name}
                </option>
              ))}
            </Select>
            <TextArea
              rows={6}
              name="inlineCss"
              id="inlineCss"
              label="Inline CSS"
              placeholder={`dialog {\n  opacity: 0.5;\n}\n`}
            />
          </Outset>
          <Outset style="flex: 1 1 auto; display: flex; flex-direction: column; gap: 8px;">
            <OutsetHead>Miscellaneous</OutsetHead>
            <Checkbox name="confirmConfigChanges" inputId="confirmConfigChanges" label="Confirm config changes" />
            <Checkbox
              name="useRelativeConfigPathsWhenPossible"
              inputId="useRelativeConfigPathsWhenPossible"
              label="Use relative config paths when possible"
            />
          </Outset>
          <Outset style="flex: 0 0 auto; display: flex; justify-content: flex-end; gap: 2px;">
            <Button type="button" onClick={() => props.onHide()}>
              Cancel
            </Button>
            <Button type="submit">OK</Button>
          </Outset>
        </Form>
      </FormikContext.Provider>
    </Dialog>
  );
};

export default Settings;
