import { FormikContext, useFormik } from "formik";
import * as Yup from "yup";
import getLabelBase from "../../common/getLabel";
import Button from "../../components/Button";
import Dialog from "../../components/Dialog";
import Checkbox from "../../components/formik/Checkbox";
import Form from "../../components/formik/Form";
import Select from "../../components/formik/Select";
import TextArea from "../../components/formik/TextArea";
import Outset from "../../components/Outset";
import OutsetHead from "../../components/OutsetHead";
import { Settings as Values } from "../../types";
import { useSettings } from "../SettingsProvider";

const SCHEMA: Yup.ObjectSchema<Values> = Yup.object({
  confirmConfigChanges: Yup.bool().label("Confirm config changes").defined().default(true),
  useRelativeConfigPathsWhenPossible: Yup.bool().label("Use relative paths when possible").defined().default(true),
  theme: Yup.string().label("Theme").optional().default(""),
  inlineCss: Yup.string().label("Inline CSS").optional().default(""),
  saveEmptyConfigValues: Yup.string()
    .label("Save empty config values")
    .oneOf(["none", "settings", "all"])
    .optional()
    .default("none"),
  showBaseCategoryCommentsByDefault: Yup.string()
    .label("Show base category comments by default")
    .oneOf(["always", "never", "auto"])
    .optional()
    .default("auto"),
});

const getLabel = getLabelBase.bind(null, SCHEMA);

type SettingsDialogProps = {
  themes: string[];
  onHide: () => void;
};

const SettingsDialog = (props: SettingsDialogProps) => {
  const { settings, setSettings } = useSettings();
  const formik = useFormik<Values>({
    initialValues: settings,
    validationSchema: SCHEMA,
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      await setSettings(values);
      props.onHide();
    },
  });

  return (
    <Dialog show onHide={props.onHide}>
      <FormikContext.Provider value={formik}>
        <Form style="display: flex; flex-direction: column;">
          <Outset style="flex: 0 0 auto; display: flex; flex-direction: column; gap: 8px;">
            <OutsetHead>Visuals</OutsetHead>
            <Select name="theme" selectId="theme" label={getLabel("theme")}>
              <option value="">Default</option>
              {props.themes?.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </Select>
            <TextArea
              rows={6}
              name="inlineCss"
              id="inlineCss"
              label={getLabel("inlineCss")}
              placeholder={`dialog {\n  opacity: 0.5;\n}\n`}
            />
          </Outset>
          <Outset style="flex: 1 1 auto; display: flex; flex-direction: column; gap: 8px;">
            <OutsetHead>Miscellaneous</OutsetHead>
            <Select
              name="saveEmptyConfigValues"
              selectId="saveEmptyConfigValues"
              label={getLabel("saveEmptyConfigValues")}
            >
              <option value="none">Don't save empty categories or settings</option>
              <option value="settings">Don't save empty categories but save empty settings</option>
              <option value="all">Save all empty values</option>
            </Select>
            <Select
              name="showBaseCategoryCommentsByDefault"
              selectId="showBaseCategoryCommentsByDefault"
              label={getLabel("showBaseCategoryCommentsByDefault")}
            >
              <option value="always">Always show base category comments</option>
              <option value="never">Always show category comments</option>
              <option value="auto">Show category comments only when not empty</option>
            </Select>
            <Checkbox
              name="confirmConfigChanges"
              id="confirmConfigChanges"
              label={getLabel("confirmConfigChanges")}
            />
            <Checkbox
              name="useRelativeConfigPathsWhenPossible"
              id="useRelativeConfigPathsWhenPossible"
              label={getLabel("useRelativeConfigPathsWhenPossible")}
            />
          </Outset>
          <Outset style="flex: 0 0 auto; display: flex; justify-content: flex-end; gap: 2px;">
            <Button onClick={props.onHide}>Cancel</Button>
            <Button type="submit">OK</Button>
          </Outset>
        </Form>
      </FormikContext.Provider>
    </Dialog>
  );
};

export default SettingsDialog;
