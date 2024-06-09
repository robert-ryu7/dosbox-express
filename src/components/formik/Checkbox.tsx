import { Field } from "formik";
import { useId } from "preact/hooks";
import CheckboxBase from "../Checkbox";

type CheckboxProps = {
  name: string;
  label?: string;
  className?: string;
  disabled?: boolean;
};

const Checkbox = ({ name, label, className, disabled }: CheckboxProps) => {
  const id = useId();

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
