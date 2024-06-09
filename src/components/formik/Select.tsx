import clsx from "clsx";
import { useField } from "formik";
import { ComponentChildren } from "preact";
import { useId } from "preact/hooks";
import SelectBase from "../Select";

type SelectProps = {
  label?: string;
  name: string;
  className?: string;
  disabled?: boolean;
  after?: JSX.Element;
  autoFocus?: boolean;
  children: ComponentChildren;
};

const Select = ({ label, name, className, disabled, after, autoFocus, children }: SelectProps) => {
  const id = useId();
  const [field, meta] = useField(name);

  return (
    <SelectBase
      className={clsx(meta.touched && meta.error && "error", className)}
      selectId={id}
      label={label}
      disabled={disabled}
      after={after}
      autoFocus={autoFocus}
      {...field}
    >
      {children}
    </SelectBase>
  );
};

export default Select;
