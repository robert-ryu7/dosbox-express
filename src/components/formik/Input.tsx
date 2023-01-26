import clsx from "clsx";
import InputBase from "../Input";
import { useField } from "formik";

type InputProps = {
  label: string;
  id: string;
  name: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  after?: JSX.Element;
};

const Input = ({ label, id, name, className, disabled, placeholder, after }: InputProps) => {
  const [field, meta] = useField(name);

  return (
    <InputBase
      className={clsx(meta.touched && meta.error && "error", className)}
      id={id}
      label={label}
      disabled={disabled}
      placeholder={placeholder}
      after={after}
      {...field}
    />
  );
};

export default Input;
