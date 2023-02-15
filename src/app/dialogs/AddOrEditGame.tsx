import Button from "../../components/Button";
import Dialog from "../../components/Dialog";
import Form from "../../components/formik/Form";
import Input from "../../components/formik/Input";
import Outset from "../../components/Outset";
import { useSettings } from "../contexts/settingsContext";

import { invoke } from "@tauri-apps/api";
import { message, open } from "@tauri-apps/api/dialog";
import { resolveResource } from "@tauri-apps/api/path";
import { FormikContext, useFormik } from "formik";
import * as Yup from "yup";

type Values = {
  title: string;
  config_path: string;
};

const validationSchema: Yup.SchemaOf<Values> = Yup.object({
  title: Yup.string().label("Title").required(),
  config_path: Yup.string().label("Config path").required(),
});

type AddOrEditGameProps = {
  id: number | null;
  initialValues: Values;
  onHide: () => void;
};

const AddOrEditGame = (props: AddOrEditGameProps) => {
  const settings = useSettings();
  const formik = useFormik<Values>({
    initialValues: props.initialValues,
    validationSchema,
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (props.id === null) await invoke("create_game", { title: values.title, configPath: values.config_path });
      else await invoke("update_game", { id: props.id, title: values.title, configPath: values.config_path });
      props.onHide();
    },
  });

  return (
    <Dialog show onHide={props.onHide}>
      <FormikContext.Provider value={formik}>
        <Form style="display: flex; flex-direction: column;">
          <Outset style="flex: 1 1 auto; display: flex; flex-direction: column; gap: 8px;">
            <Input name="title" id="title" label="Title" placeholder="Name of the game" />
            <Input
              name="config_path"
              id="config_path"
              label="Config path"
              placeholder="Path to DOSBox config file"
              after={
                <Button
                  onClick={async () => {
                    try {
                      let path = await open({
                        defaultPath: await resolveResource("games"),
                        multiple: false,
                        filters: [
                          {
                            name: "All files",
                            extensions: ["*"],
                          },
                          {
                            name: "DOSBox configuration file",
                            extensions: ["conf"],
                          },
                        ],
                      });
                      if (Array.isArray(path)) path = null;

                      if (
                        path !== null &&
                        settings.find((setting) => setting.key === "useRelativeConfigPathsWhenPossible")?.value === "1"
                      ) {
                        const relativePath = await invoke<string | null>("make_relative_path", { path });
                        path = relativePath;
                      }

                      formik.setFieldValue("config_path", path ?? "");
                    } catch (err: unknown) {
                      message(String(err), { type: "error" });
                    }
                  }}
                >
                  Select
                </Button>
              }
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

export default AddOrEditGame;
