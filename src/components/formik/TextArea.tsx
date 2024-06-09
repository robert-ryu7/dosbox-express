import clsx from "clsx";
import { useField } from "formik";
import { useId } from "preact/hooks";
import TextAreaBase from "../TextArea";

type TextAreaProps = {
  label?: string;
  name: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  after?: JSX.Element;
  rows?: number;
};

const TextArea = ({ label, name, className, disabled, placeholder, after, rows }: TextAreaProps) => {
  const id = useId();
  const [field, meta] = useField(name);

  return (
    <TextAreaBase
      className={clsx(meta.touched && meta.error && "has-error", className)}
      textareaId={id}
      label={label}
      disabled={disabled}
      placeholder={placeholder}
      after={after}
      rows={rows}
      {...field}
    />
  );
};

export default TextArea;
