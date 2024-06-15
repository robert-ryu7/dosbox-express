import * as api from "../../common/api";
import Button from "../../components/Button";
import Dialog from "../../components/Dialog";
import Form from "../../components/formik/Form";
import Input from "../../components/formik/Input";
import Outset from "../../components/Outset";

import { FormikContext, useFormik } from "formik";
import { useMemo, useState } from "preact/hooks";
import * as Yup from "yup";
import { ExtendedGame } from "../../common/api";
import getLabelBase from "../../common/getLabel";
import Checkbox from "../../components/formik/Checkbox";
import List from "../../components/List";
import OutsetHead from "../../components/OutsetHead";
import { useSettings } from "../SettingsProvider";

type Values = {
  title: string;
  resetRunTime: boolean;
  configPath: string;
  addons: api.Addon[] | null;
};

const SCHEMA: Yup.ObjectSchema<Values> = Yup.object({
  title: Yup.string().label("Title").required(),
  resetRunTime: Yup.boolean().label("Reset run time").defined(),
  configPath: Yup.string().label("Config path").required(),
  addons: Yup.array(api.ADDON_SCHEMA).defined().nullable(),
});

const getLabel = getLabelBase.bind(null, SCHEMA);

type EditGameDialogProps = ExtendedGame & {
  onHide: () => void;
};

const EditGameDialog = (props: EditGameDialogProps) => {
  const [selectedAddon, setSelectedAddon] = useState<number | null>(null);
  const { settings } = useSettings();
  const initialValues = useMemo<Values>(
    () => ({ title: props.title, resetRunTime: false, configPath: props.config_path, addons: props.addons }),
    [props.title, props.config_path, props.addons],
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
            <OutsetHead>Basic information</OutsetHead>
            <Input name="title" label={getLabel("title")} placeholder="Name of the game" />
            <Input
              name="configPath"
              label={getLabel("configPath")}
              placeholder="Path to DOSBox config file"
              after={<Button onClick={handleSelect}>Select</Button>}
            />
          </Outset>
          <Outset style="flex: 1 1 120px; display: flex; flex-direction: column; gap: 4px;">
            <OutsetHead>Addons</OutsetHead>
            <List<api.Addon, number>
              style="flex: 1 1 auto;"
              getKey={(_, index) => index}
              items={formik.values.addons ?? new Error("Invalid data")}
              selection={selectedAddon}
              onSelect={setSelectedAddon}
              onErrorClear={() => formik.setFieldValue("addons", [])}
            >
              {(addon) => (
                <>
                  <span style="color: var(--color-front-alt);">{addon.type}</span>{" "}
                  <span>
                    {addon.title} ({addon.config_path})
                  </span>
                </>
              )}
            </List>
          </Outset>
          <Outset style="flex: 1 1 auto; display: flex; flex-direction: column; gap: 8px;">
            <Checkbox name="resetRunTime" label={getLabel("resetRunTime")} />
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
