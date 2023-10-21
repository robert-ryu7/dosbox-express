import { Field } from "formik";
import CheckboxBase from "../Checkbox";

type CheckboxProps = {
  label?: string;
  id: string;
  name: string;
  className?: string;
  disabled?: boolean;
};

const Checkbox = ({ label, id, name, className, disabled }: CheckboxProps) => {
  return (
    <Field
      type="checkbox"
      name={name}
      id={id}
      disabled={disabled}
      as={CheckboxBase}
      label={label}
      className={className}
    />
  );
};

export default Checkbox;
