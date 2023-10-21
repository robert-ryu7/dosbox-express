import * as api from "../../common/api";
import Button from "../../components/Button";
import Dialog from "../../components/Dialog";
import Form from "../../components/formik/Form";
import Input from "../../components/formik/Input";
import Outset from "../../components/Outset";

import { FormikContext, useFormik } from "formik";
import { useMemo } from "preact/hooks";
import * as Yup from "yup";
import getLabelBase from "../../common/getLabel";
import Checkbox from "../../components/formik/Checkbox";
import { Game } from "../../types";
import { useSettings } from "../SettingsProvider";

type Values = {
  title: string;
  resetRunTime: boolean;
  configPath: string;
};

const SCHEMA: Yup.ObjectSchema<Values> = Yup.object({
  title: Yup.string().label("Title").required(),
  resetRunTime: Yup.boolean().label("Reset run time").defined(),
  configPath: Yup.string().label("Config path").required(),
});

const getLabel = getLabelBase.bind(null, SCHEMA);

type EditGameDialogProps = Game & {
  onHide: () => void;
};

const EditGameDialog = (props: EditGameDialogProps) => {
  const { settings } = useSettings();
  const initialValues = useMemo<Values>(
    () => ({ title: props.title, resetRunTime: false, configPath: props.config_path }),
    [props.title, props.config_path],
  );
  const formik = useFormik<Values>({
    initialValues,
    validationSchema: SCHEMA,
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        await api.updateGame({ ...values, id: props.id });
        props.onHide();
      } catch (error) {
        await api.error(error);
      }
    },
  });

  const handleSelect = async () => {
    try {
      const path = await api.selectConfigPath(settings.useRelativeConfigPathsWhenPossible);
      await formik.setFieldValue("configPath", path ?? "");
    } catch (error) {
      await api.error(error);
    }
  };

  return (
    <Dialog show onHide={props.onHide}>
      <FormikContext.Provider value={formik}>
        <Form style="display: flex; flex-direction: column;">
          <Outset style="flex: 1 1 auto; display: flex; flex-direction: column; gap: 8px;">
            <Input name="title" inputId="title" label={getLabel("title")} placeholder="Name of the game" />
            <Input
              name="configPath"
              inputId="configPath"
              label={getLabel("configPath")}
              placeholder="Path to DOSBox config file"
              after={<Button onClick={handleSelect}>Select</Button>}
            />
            <Checkbox name="resetRunTime" inputId="resetRunTime" label={getLabel("resetRunTime")} />
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

export default EditGameDialog;
