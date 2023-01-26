import { invoke } from "@tauri-apps/api";
import { message, open } from "@tauri-apps/api/dialog";
import { useFormik, FormikContext } from "formik";
import * as Yup from "yup";

import Button from "../../components/Button";
import Input from "../../components/formik/Input";
import { useEffect } from "preact/hooks";
import Dialog from "../../components/Dialog";
import Outset from "../../components/Outset";
import Form from "../../components/formik/Form";

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
