import { invoke } from "@tauri-apps/api";
import { message, open } from "@tauri-apps/api/dialog";
import { useFormik, FormikContext } from "formik";
import * as Yup from "yup";

import Button from "../../components/Button";
import Input from "../../components/formik/Input";
import Dialog from "../../components/Dialog";
import { Game } from "../../types";
import Outset from "../../components/Outset";
import Form from "../../components/formik/Form";
import { useSettings } from "../contexts/settingsContext";

type Values = {
  title: string;
  configPath: string;
};

const initialValues: Values = {
  title: "",
  configPath: "",
};

const validationSchema: Yup.SchemaOf<Values> = Yup.object({
  title: Yup.string().label("Title").required(),
  configPath: Yup.string().label("Config path").required(),
});

type EditGameProps = {
  game: Game | null;
  onHide: () => void;
};

const EditGame = (props: EditGameProps) => {
  const settings = useSettings();
  const formik = useFormik<Values>({
    initialValues: props.game ? { title: props.game.title, configPath: props.game.config_path } : initialValues,
    validationSchema,
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      await invoke("edit_game", { ...props.game, ...values });
      props.onHide();
    },
  });

  return (
    <Dialog show={!!props.game} onHide={props.onHide}>
      <FormikContext.Provider value={formik}>
        <Form style="display: flex; flex-direction: column;">
          <Outset style="flex: 1 1 auto; display: flex; flex-direction: column; gap: 8px;">
            <Input name="title" id="title" label="Title" placeholder="Name of the game" />
            <Input
              name="configPath"
              id="configPath"
              label="Config path"
              placeholder="Path to DOSBox config file"
              after={
                <Button
                  onClick={async () => {
                    try {
                      let path = await open({
                        multiple: false,
                        filters: [
                          {
                            name: "DOSBox configuration file",
                            extensions: ["conf"],
                          },
                        ],
                      });

                      if (
                        settings.find((setting) => setting.key === "useRelativeConfigPathsWhenPossible")?.value === "1"
                      ) {
                        const relativePath = await invoke<string | null>("make_relative_path", { path });
                        if (relativePath) path = relativePath;
                      }

                      if (typeof path === "string") {
                        formik.setFieldValue("configPath", path);
                      }
                    } catch (err: unknown) {
                      message(String(err), { type: "error" });
                    }
                  }}
                >
                  Select file
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

export default EditGame;
