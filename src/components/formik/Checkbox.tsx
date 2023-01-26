import clsx from "clsx";
import { Field } from "formik";

type CheckboxProps = {
  label: string;
  id: string;
  name: string;
  className?: string;
  disabled?: boolean;
};

const Checkbox = ({ label, id, name, className, disabled }: CheckboxProps) => {
  return (
    <div className={clsx("checkbox", className)}>
      <label for={id}>{label}</label>
      <Field type="checkbox" name={name} id={id} disabled={disabled} />
    </div>
  );
};

export default Checkbox;
