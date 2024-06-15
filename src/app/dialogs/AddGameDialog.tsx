import * as api from "../../common/api";
import Button from "../../components/Button";
import Dialog from "../../components/Dialog";
import Form from "../../components/formik/Form";
import Input from "../../components/formik/Input";
import Outset from "../../components/Outset";

import { FormikContext, useFormik } from "formik";
import { useState } from "preact/hooks";
import * as Yup from "yup";
import getLabelBase from "../../common/getLabel";
import List from "../../components/List";
import OutsetHead from "../../components/OutsetHead";
import { useSettings } from "../SettingsProvider";

type Values = { title: string; config_path: string; addons: api.Addon[] };

const INITIAL_VALUES: Values = { title: "", config_path: "", addons: [] };

const SCHEMA: Yup.ObjectSchema<Values> = Yup.object({
  title: Yup.string().label("Title").required(),
  config_path: Yup.string().label("Config path").required(),
  addons: Yup.array(api.ADDON_SCHEMA).required(),
});

const getLabel = getLabelBase.bind(null, SCHEMA);

type AddGameDialogProps = {
  onHide: () => void;
};

const AddGameDialog = (props: AddGameDialogProps) => {
  const [selectedAddon, setSelectedAddon] = useState<number | null>(null);
  const { settings } = useSettings();
  const formik = useFormik<Values>({
    initialValues: INITIAL_VALUES,
    validationSchema: SCHEMA,
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        await api.createGame(values.title, values.config_path);
        props.onHide();
      } catch (error) {
        await api.error(error);
      }
    },
  });

  const handleSelect = async () => {
    try {
      const path = await api.selectConfigPath(settings.useRelativeConfigPathsWhenPossible);
      await formik.setFieldValue("config_path", path ?? "");
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
              name="config_path"
              label={getLabel("config_path")}
              placeholder="Path to DOSBox config file"
              after={<Button onClick={handleSelect}>Select</Button>}
            />
          </Outset>
          <Outset style="flex: 1 1 120px; display: flex; flex-direction: column; gap: 4px;">
            <OutsetHead>Addons</OutsetHead>
            <List<api.Addon, number>
              style="flex: 1 1 auto;"
              getKey={(_, index) => index}
              items={formik.values.addons}
              selection={selectedAddon}
              onSelect={setSelectedAddon}
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
          <Outset style="flex: 0 0 auto; display: flex; justify-content: flex-end; gap: 2px;">
            <Button onClick={props.onHide}>Cancel</Button>
            <Button type="submit">OK</Button>
          </Outset>
        </Form>
      </FormikContext.Provider>
    </Dialog>
  );
};

export default AddGameDialog;
