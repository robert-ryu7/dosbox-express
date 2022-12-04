import { invoke } from "@tauri-apps/api";
import { appWindow } from "@tauri-apps/api/window";
import { message, open } from "@tauri-apps/api/dialog";
import { useFormik, FormikContext, Form, Field } from "formik";
import * as Yup from "yup";

import { WindowProps } from "../types";
import Button from "../components/Button";
import Input from "../components/formik/Input";

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

const AddGame = (props: WindowProps) => {
  const formik = useFormik<Values>({
    initialValues,
    validationSchema,
    validateOnMount: true,
    onSubmit: async (values) => {
      // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
      await invoke("create_game", values);
      await appWindow.close();
    },
  });

  return (
    <FormikContext.Provider value={formik}>
      <form
        onReset={formik.handleReset}
        onSubmit={(e?: any) => {
          if (!formik.isValid) {
            let text = ["Cannot continue due to errors:"]
              .concat(...Object.values(formik.errors).map((error) => `• ${error}`))
              .join("\n");

            message(text, {
              title: "DOSBox Express",
              type: "error",
            });
          }
          formik.handleSubmit(e);
        }}
        action="#"
        style="flex: 1 1 auto; display: flex; flex-direction: column;"
      >
        <div style="overflow: auto; background: var(--color-primary); flex: 1 1 auto; display: flex; flex-direction: column; gap: 8px; padding: 8px;">
          <Input name="title" id="title" label="Title" placeholder="Name of the game" />
          <Input
            name="configPath"
            id="configPath"
            label="Config path"
            placeholder="Path to DOSBox config file"
            after={
              <Button
                onClick={async () => {
                  const selected = await open({
                    multiple: false,
                    filters: [
                      {
                        name: "DOSBox configuration file",
                        extensions: ["conf"],
                      },
                    ],
                  });

                  if (selected !== null) {
                    formik.setFieldValue("configPath", selected);
                  }
                }}
              >
                Select file
              </Button>
            }
          />
        </div>
        <div
          class="outset"
          style="flex: 0 0 auto; display: flex; justify-content: flex-end; gap: 2px; padding: 4px; border-width: var(--border-width) 0 0 0;"
        >
          <Button type="button" onClick={() => appWindow.close()}>
            Cancel
          </Button>
          <Button type="submit">OK</Button>
        </div>
      </form>
    </FormikContext.Provider>
  );
};

export default AddGame;
