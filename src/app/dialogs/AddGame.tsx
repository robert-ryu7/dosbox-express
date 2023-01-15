import { invoke } from "@tauri-apps/api";
import { message, open } from "@tauri-apps/api/dialog";
import { useFormik, FormikContext } from "formik";
import * as Yup from "yup";

import Button from "../../components/Button";
import Input from "../../components/formik/Input";
import { useEffect } from "preact/hooks";
import Dialog from "../../components/Dialog";

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

type AddGameProps = {
  show: boolean;
  onHide: () => void;
};

const AddGame = (props: AddGameProps) => {
  const formik = useFormik<Values>({
    initialValues,
    validationSchema,
    validateOnMount: true,
    onSubmit: async (values) => {
      await invoke("add_game", values);
      props.onHide();
    },
  });

  useEffect(() => {
    if (props.show) formik.resetForm();
  }, [props.show]);

  return (
    <Dialog show={props.show} onHide={props.onHide}>
      <FormikContext.Provider value={formik}>
        <form
          autoComplete="off"
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
          <div
            class="outset"
            style="flex: 1 1 auto; display: flex; flex-direction: column; gap: 8px; padding: 8px; border-width: 0 0 var(--border-width) 0;"
          >
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
            <Button type="button" onClick={() => props.onHide()}>
              Cancel
            </Button>
            <Button type="submit">OK</Button>
          </div>
        </form>
      </FormikContext.Provider>
    </Dialog>
  );
};

export default AddGame;
