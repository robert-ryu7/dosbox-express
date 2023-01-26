import clsx from "clsx";
import TextAreaBase from "../TextArea";
import { useField } from "formik";

type TextAreaProps = {
  label: string;
  id: string;
  name: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  after?: JSX.Element;
};

const TextArea = ({ label, id, name, className, disabled, placeholder, after }: TextAreaProps) => {
  const [field, meta] = useField(name);

  return (
    <TextAreaBase
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

export default TextArea;
