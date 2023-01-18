import clsx from "clsx";
import TextAreaBase from "../TextArea";
import { useField } from "formik";

type TextAreaProps = {
  label: string;
  id: string;
  name: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  after?: JSX.Element;
};

const TextArea = ({ label, id, name, className, placeholder, disabled, after }: TextAreaProps) => {
  const [field, meta] = useField(name);

  return (
    <TextAreaBase
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

export default TextArea;
