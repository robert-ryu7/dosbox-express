import clsx from "clsx";
import { useField } from "formik";
import InputBase from "../Input";

type InputProps = {
  label?: string;
  inputId: string;
  name: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  after?: JSX.Element;
};

const Input = ({ label, inputId, name, className, disabled, placeholder, after }: InputProps) => {
  const [field, meta] = useField(name);

  return (
    <InputBase
      className={clsx(meta.touched && meta.error && "error", className)}
      inputId={inputId}
      label={label}
      disabled={disabled}
      placeholder={placeholder}
      after={after}
      {...field}
    />
  );
};

export default Input;
