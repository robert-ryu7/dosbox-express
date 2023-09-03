import CheckboxBase from "../Checkbox";
import { Field } from "formik";

type CheckboxProps = {
  label: string;
  inputId: string;
  name: string;
  className?: string;
  disabled?: boolean;
};

const Checkbox = ({ label, inputId, name, className, disabled }: CheckboxProps) => {
  return (
    <Field
      type="checkbox"
      name={name}
      id={inputId}
      disabled={disabled}
      as={CheckboxBase}
      label={label}
      className={className}
    />
  );
};

export default Checkbox;
