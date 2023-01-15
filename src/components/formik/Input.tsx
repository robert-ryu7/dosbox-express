import clsx from "clsx";
import InputBase from "../Input";
import { useField } from "formik";

type InputProps = {
  label: string;
  id: string;
  name: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  after?: JSX.Element;
};

const Input = ({ label, id, name, className, placeholder, disabled, after }: InputProps) => {
  const [field, meta] = useField(name);

  return (
    <InputBase
      className={clsx(meta.touched && meta.error && "error", className)}
      id={id}
      label={label}
      placeholder={placeholder}
      disabled={disabled}
      after={after}
      {...field}
    />
  );
};

export default Input;
