import { message } from "@tauri-apps/api/dialog";
import { useFormik, FormikContext } from "formik";
import * as Yup from "yup";

import Button from "../../components/Button";
import Input from "../../components/formik/Input";
import { useEffect } from "preact/hooks";
import Dialog from "../../components/Dialog";
import Outset from "../../components/Outset";
import Form from "../../components/formik/Form";
import getLabelBase from "../../common/getLabel";

type Values = {
  name: string;
};

const INITIAL_VALUES: Values = {
  name: "",
};

const SCHEMA: Yup.ObjectSchema<Values> = Yup.object({
  name: Yup.string().label("Name").required(),
});

const getLabel = getLabelBase.bind(null, SCHEMA);

type AddSettingProps = {
  show: boolean;
  onHide: () => void;
  onSubmit: (values: Values) => Promise<void>;
};

const AddSetting = (props: AddSettingProps) => {
  const formik = useFormik<Values>({
    initialValues: INITIAL_VALUES,
    validationSchema: SCHEMA,
    validateOnMount: true,
    onSubmit: props.onSubmit,
  });

  useEffect(() => {
    if (props.show) formik.resetForm();
  }, [props.show]);

  return (
    <Dialog show={props.show} onHide={props.onHide}>
      <FormikContext.Provider value={formik}>
        <Form style="display: flex; flex-direction: column;">
          <Outset style="flex: 1 1 auto; display: flex; flex-direction: column; gap: 8px;">
            <Input name="name" inputId="name" label={getLabel("name")} placeholder="Name of the setting" />
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

export default AddSetting;
