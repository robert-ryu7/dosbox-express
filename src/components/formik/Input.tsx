import clsx from "clsx";
import { useField } from "formik";
import { useId } from "preact/hooks";
import InputBase from "../Input";

type InputProps = {
  label?: string;
  componentId?: string;
  name: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  after?: JSX.Element;
};

const Input = ({ label, componentId, name, className, disabled, placeholder, after }: InputProps) => {
  const id = useId();
  const [field, meta] = useField(name);

  return (
    <InputBase
      className={clsx(meta.touched && meta.error && "has-error", className)}
      id={id}
      componentId={componentId}
      label={label}
      disabled={disabled}
      placeholder={placeholder}
      after={after}
      {...field}
    />
  );
};

export default Input;
