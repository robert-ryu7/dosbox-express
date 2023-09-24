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
import Checkbox from "../../components/formik/Checkbox";
import { Game } from "../../types";
import { useMemo } from "preact/hooks";
import getLabelBase from "../../common/getLabel";

type Values = {
  title: string;
  reset_run_time: boolean;
  config_path: string;
};

const SCHEMA: Yup.ObjectSchema<Values> = Yup.object({
  title: Yup.string().label("Title").required(),
  reset_run_time: Yup.boolean().label("Reset run time").defined(),
  config_path: Yup.string().label("Config path").required(),
});

const getLabel = getLabelBase.bind(null, SCHEMA);

type EditGameProps = Game & {
  onHide: () => void;
};

const EditGame = (props: EditGameProps) => {
  const { settings } = useSettings();
  const initialValues = useMemo<Values>(
    () => ({ title: props.title, reset_run_time: false, config_path: props.config_path }),
    [props.title, props.config_path]
  );
  const formik = useFormik<Values>({
    initialValues,
    validationSchema: SCHEMA,
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      await invoke("update_game", {
        id: props.id,
        title: values.title,
        resetRunTime: values.reset_run_time,
        configPath: values.config_path,
      });
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
            <Checkbox name="reset_run_time" inputId="reset_run_time" label={getLabel("reset_run_time")} />
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
