import attempt from "../../common/attempt";
import Button from "../../components/Button";
import Dialog from "../../components/Dialog";
import Form from "../../components/formik/Form";
import Input from "../../components/formik/Input";
import Outset from "../../components/Outset";

import { invoke } from "@tauri-apps/api";
import { confirm, open } from "@tauri-apps/api/dialog";
import { extname, resolveResource } from "@tauri-apps/api/path";
import { FormikContext, useFormik } from "formik";
import * as Yup from "yup";
import { useSettings } from "../SettingsProvider";
import getLabelBase from "../../common/getLabel";

type Values = {
  title: string;
  config_path: string;
};

const SCHEMA: Yup.ObjectSchema<Values> = Yup.object({
  title: Yup.string().label("Title").required(),
  config_path: Yup.string().label("Config path").required(),
});

const getLabel = getLabelBase.bind(null, SCHEMA);

type AddGameProps = {
  onHide: () => void;
};

const INITIAL_VALUES: Values = { title: "", config_path: "" };

const AddGame = (props: AddGameProps) => {
  const { settings } = useSettings();
  const formik = useFormik<Values>({
    initialValues: INITIAL_VALUES,
    validationSchema: SCHEMA,
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      await invoke("create_game", { title: values.title, configPath: values.config_path });
      props.onHide();
    },
  });

  return (
    <Dialog show onHide={props.onHide}>
      <FormikContext.Provider value={formik}>
        <Form style="display: flex; flex-direction: column;">
          <Outset style="flex: 1 1 auto; display: flex; flex-direction: column; gap: 8px;">
            <Input name="title" inputId="title" label={getLabel("title")} placeholder="Name of the game" />
            <Input
              name="config_path"
              inputId="config_path"
              label={getLabel("config_path")}
              placeholder="Path to DOSBox config file"
              after={
                <Button
                  onClick={attempt(async () => {
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
                        {
                          name: "MS-DOS executable file",
                          extensions: ["EXE", "COM", "exe", "com"],
                        },
                      ],
                    });
                    if (Array.isArray(path)) path = null;

                    if (path !== null) {
                      switch (await extname(path)) {
                        case "EXE":
                        case "COM":
                        case "exe":
                        case "com": {
                          if (
                            await confirm(
                              "You have selected an executable file, do you want to generate a basic DOSBox configuration for it if it doesn't exist?",
                              {
                                title: "Generate configuration file",
                                type: "warning",
                              }
                            )
                          ) {
                            path = await invoke<string | null>("generate_game_config", { executablePath: path });
                          } else {
                            path = null;
                          }
                          break;
                        }
                        default: {
                          break;
                        }
                      }
                    }

                    if (path !== null && settings.useRelativeConfigPathsWhenPossible) {
                      const relativePath = await invoke<string | null>("make_relative_path", { path });
                      path = relativePath;
                    }

                    formik.setFieldValue("config_path", path ?? "");
                  })}
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

export default AddGame;
