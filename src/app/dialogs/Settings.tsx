import Dialog from "../../components/Dialog";
import Outset from "../../components/Outset";
import { useFormik, FormikContext } from "formik";
import * as Yup from "yup";
import Button from "../../components/Button";
import Form from "../../components/formik/Form";
import Checkbox from "../../components/formik/Checkbox";
import { useMemo } from "preact/hooks";
import { invoke } from "@tauri-apps/api";
import { useSettings } from "../contexts/settingsContext";
import Input from "../../components/formik/Input";
import {
  DEFAULT_BUTTON_SHADES,
  DEFAULT_PRIMARY_SHADES,
  DEFAULT_SCROLLBAR_COLOR,
  DEFAULT_BACK_COLOR,
  DEFAULT_BACK_BRIGHT_COLOR,
  DEFAULT_BACK_BRIGHTER_COLOR,
  DEFAULT_FRONT_COLOR,
  DEFAULT_FRONT_ALT_COLOR,
  DEFAULT_INPUT_PLACEHOLDER_COLOR,
  DEFAULT_INPUT_DISABLED_BG_COLOR,
  getContrast,
  getShades,
  normalizeColor,
} from "../../common/theme";
import { ComponentChildren } from "preact";
import OutsetHead from "../../components/OutsetHead";

type Values = {
  confirmConfigChanges: boolean;
  useRelativeConfigPathsWhenPossible: boolean;
  primaryColor: string | undefined;
  buttonColor: string | undefined;
  scrollbarColor: string | undefined;
  backColor: string | undefined;
  backBrightColor: string | undefined;
  backBrighterColor: string | undefined;
  frontColor: string | undefined;
  frontAltColor: string | undefined;
  inputPlaceholderColor: string | undefined;
  inputDisabledBgColor: string | undefined;
};

const validationSchema: Yup.SchemaOf<Values> = Yup.object({
  confirmConfigChanges: Yup.bool().label("Confirm config changes").defined(),
  useRelativeConfigPathsWhenPossible: Yup.bool().label("Confirm config changes").defined(),
  primaryColor: Yup.string().label("Primary color").color().optional(),
  buttonColor: Yup.string().label("Button color").color().optional(),
  scrollbarColor: Yup.string().label("Scrollbar color").color().optional(),
  backColor: Yup.string().label("Back color").color().optional(),
  backBrightColor: Yup.string().label("Back bright color").color().optional(),
  backBrighterColor: Yup.string().label("Back brighter color").color().optional(),
  frontColor: Yup.string().label("Front color").color().optional(),
  frontAltColor: Yup.string().label("Front alternative color").color().optional(),
  inputPlaceholderColor: Yup.string().label("Input placeholder color").color().optional(),
  inputDisabledBgColor: Yup.string().label("Input disabled background color").color().optional(),
});

const PreviewFrame = (props: { children: ComponentChildren }) => (
  <div
    style={{
      width: "24px",
      boxSizing: "border-box",
      position: "relative",
      background: "#000",
    }}
  >
    {props.children}
  </div>
);

type PreviewShadesProps = {
  base: string;
  bright: string;
  dark: string;
  darker: string;
  color: string;
};

const PreviewShades = (props: PreviewShadesProps) => {
  return (
    <PreviewFrame>
      <div
        style={{
          borderStyle: "solid",
          borderWidth: "2px",
          borderColor: [props.bright, props.darker, props.dark, props.bright].join(" "),
          background: props.base,
          color: props.color,
          padding: "4px",
          overflow: "hidden",
          position: "absolute",
          inset: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {"\u263A"}
      </div>
    </PreviewFrame>
  );
};

type PreviewColorProps = {
  color: string;
};

const PreviewColor = (props: PreviewColorProps) => {
  return (
    <PreviewFrame>
      <div style={{ position: "absolute", inset: 2, background: props.color }} />
    </PreviewFrame>
  );
};

type SettingsProps = {
  show: boolean;
  onHide: () => void;
};

const Settings = (props: SettingsProps) => {
  const settings = useSettings();
  const initialValues = useMemo<Values>(() => {
    return {
      confirmConfigChanges: settings.find((setting) => setting.key === "confirmConfigChanges")?.value === "1",
      useRelativeConfigPathsWhenPossible:
        settings.find((setting) => setting.key === "useRelativeConfigPathsWhenPossible")?.value === "1",
      primaryColor: settings.find((setting) => setting.key === "primaryColor")?.value ?? "",
      buttonColor: settings.find((setting) => setting.key === "buttonColor")?.value ?? "",
      scrollbarColor: settings.find((setting) => setting.key === "scrollbarColor")?.value ?? "",
      backColor: settings.find((setting) => setting.key === "backColor")?.value ?? "",
      backBrightColor: settings.find((setting) => setting.key === "backBrightColor")?.value ?? "",
      backBrighterColor: settings.find((setting) => setting.key === "backBrighterColor")?.value ?? "",
      frontColor: settings.find((setting) => setting.key === "frontColor")?.value ?? "",
      frontAltColor: settings.find((setting) => setting.key === "frontAltColor")?.value ?? "",
      inputPlaceholderColor: settings.find((setting) => setting.key === "inputPlaceholderColor")?.value ?? "",
      inputDisabledBgColor: settings.find((setting) => setting.key === "inputDisabledBgColor")?.value ?? "",
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
          { key: "primaryColor", value: values.primaryColor },
          { key: "buttonColor", value: values.buttonColor },
          { key: "scrollbarColor", value: values.scrollbarColor },
          { key: "backColor", value: values.backColor },
          { key: "backBrightColor", value: values.backBrightColor },
          { key: "backBrighterColor", value: values.backBrighterColor },
          { key: "frontColor", value: values.frontColor },
          { key: "frontAltColor", value: values.frontAltColor },
          { key: "inputPlaceholderColor", value: values.inputPlaceholderColor },
          { key: "inputDisabledBgColor", value: values.inputDisabledBgColor },
        ],
      });
      props.onHide();
    },
  });
  const { values } = formik;
  const primaryColors = useMemo(
    () => (values.primaryColor ? getShades(values.primaryColor, DEFAULT_PRIMARY_SHADES) : DEFAULT_PRIMARY_SHADES),
    [values.primaryColor]
  );
  const buttonColors = useMemo(
    () => (values.buttonColor ? getShades(values.buttonColor, DEFAULT_BUTTON_SHADES) : DEFAULT_BUTTON_SHADES),
    [values.buttonColor]
  );
  const scrollbarColor = useMemo(
    () => (values.scrollbarColor ? normalizeColor(values.scrollbarColor) : DEFAULT_SCROLLBAR_COLOR),
    [values.scrollbarColor]
  );
  const backColor = useMemo(
    () => (values.backColor ? normalizeColor(values.backColor) : DEFAULT_BACK_COLOR),
    [values.backColor]
  );
  const backBrightColor = useMemo(
    () => (values.backBrightColor ? normalizeColor(values.backBrightColor) : DEFAULT_BACK_BRIGHT_COLOR),
    [values.backBrightColor]
  );
  const backBrighterColor = useMemo(
    () => (values.backBrighterColor ? normalizeColor(values.backBrighterColor) : DEFAULT_BACK_BRIGHTER_COLOR),
    [values.backBrighterColor]
  );
  const frontColor = useMemo(
    () => (values.frontColor ? normalizeColor(values.frontColor) : DEFAULT_FRONT_COLOR),
    [values.frontColor]
  );
  const frontAltColor = useMemo(
    () => (values.frontAltColor ? normalizeColor(values.frontAltColor) : DEFAULT_FRONT_ALT_COLOR),
    [values.frontAltColor]
  );
  const inputPlaceholderColor = useMemo(
    () =>
      values.inputPlaceholderColor ? normalizeColor(values.inputPlaceholderColor) : DEFAULT_INPUT_PLACEHOLDER_COLOR,
    [values.inputPlaceholderColor]
  );
  const inputDisabledBgColor = useMemo(
    () => (values.inputDisabledBgColor ? normalizeColor(values.inputDisabledBgColor) : DEFAULT_INPUT_DISABLED_BG_COLOR),
    [values.inputDisabledBgColor]
  );

  return (
    <Dialog show={props.show} onHide={props.onHide}>
      <FormikContext.Provider value={formik}>
        <Form style="display: flex; flex-direction: column;">
          <Outset style="flex: 0 0 auto; display: flex; flex-direction: column; gap: 8px;">
            <OutsetHead>Theme</OutsetHead>
            <div style="flex: 1 1 auto; display: flex; gap: 8px;">
              <div>
                <Input
                  name="primaryColor"
                  id="primaryColor"
                  label="Primary color"
                  placeholder={DEFAULT_PRIMARY_SHADES.base}
                  after={<PreviewShades {...primaryColors} color={getContrast(primaryColors.base)} />}
                />
                <Input
                  name="buttonColor"
                  id="buttonColor"
                  label="Button color"
                  placeholder={DEFAULT_BUTTON_SHADES.base}
                  after={<PreviewShades {...buttonColors} color={getContrast(buttonColors.base)} />}
                />
                <Input
                  name="scrollbarColor"
                  id="scrollbarColor"
                  label="Scrollbar color"
                  placeholder={DEFAULT_SCROLLBAR_COLOR}
                  after={<PreviewColor color={scrollbarColor} />}
                />
                <Input
                  name="frontColor"
                  id="frontColor"
                  label="Front color"
                  placeholder={DEFAULT_FRONT_COLOR}
                  after={<PreviewColor color={frontColor} />}
                />
                <Input
                  name="frontAltColor"
                  id="frontAltColor"
                  label="Front alternative color"
                  placeholder={DEFAULT_FRONT_ALT_COLOR}
                  after={<PreviewColor color={frontAltColor} />}
                />
              </div>
              <div>
                <Input
                  name="backColor"
                  id="backColor"
                  label="Back color"
                  placeholder={DEFAULT_BACK_COLOR}
                  after={<PreviewColor color={backColor} />}
                />
                <Input
                  name="backBrightColor"
                  id="backBrightColor"
                  label="Back bright color"
                  placeholder={DEFAULT_BACK_BRIGHT_COLOR}
                  after={<PreviewColor color={backBrightColor} />}
                />
                <Input
                  name="backBrighterColor"
                  id="backBrighterColor"
                  label="Back brighter color"
                  placeholder={DEFAULT_BACK_BRIGHTER_COLOR}
                  after={<PreviewColor color={backBrighterColor} />}
                />
                <Input
                  name="inputPlaceholderColor"
                  id="inputPlaceholderColor"
                  label="Input placeholder color"
                  placeholder={DEFAULT_INPUT_PLACEHOLDER_COLOR}
                  after={<PreviewColor color={inputPlaceholderColor} />}
                />
                <Input
                  name="inputDisabledBgColor"
                  id="inputDisabledBgColor"
                  label="Input disabled color"
                  placeholder={DEFAULT_INPUT_DISABLED_BG_COLOR}
                  after={<PreviewColor color={inputDisabledBgColor} />}
                />
              </div>
            </div>
          </Outset>
          <Outset style="flex: 1 1 auto; display: flex; flex-direction: column; gap: 8px;">
            <OutsetHead>Miscellaneous</OutsetHead>
            <Checkbox name="confirmConfigChanges" id="confirmConfigChanges" label="Confirm config changes" />
            <Checkbox
              name="useRelativeConfigPathsWhenPossible"
              id="useRelativeConfigPathsWhenPossible"
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
