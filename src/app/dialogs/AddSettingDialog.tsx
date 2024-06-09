import { FormikContext, useFormik } from "formik";
import * as Yup from "yup";

import getLabelBase from "../../common/getLabel";
import Button from "../../components/Button";
import Dialog from "../../components/Dialog";
import Form from "../../components/formik/Form";
import Input from "../../components/formik/Input";
import Outset from "../../components/Outset";

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

type AddSettingDialogProps = {
  onHide: () => void;
  onSubmit: (values: Values) => void;
};

const AddSettingDialog = (props: AddSettingDialogProps) => {
  const formik = useFormik<Values>({
    initialValues: INITIAL_VALUES,
    validationSchema: SCHEMA,
    validateOnMount: true,
    onSubmit: props.onSubmit,
  });

  return (
    <Dialog show onHide={props.onHide}>
      <FormikContext.Provider value={formik}>
        <Form style="display: flex; flex-direction: column;">
          <Outset style="flex: 1 1 auto; display: flex; flex-direction: column; gap: 8px;">
            <Input name="name" label={getLabel("name")} placeholder="Name of the setting" />
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

export default AddSettingDialog;
