import clsx from "clsx";
import SelectBase from "../Select";
import { useField } from "formik";
import { ComponentChildren } from "preact";

type SelectProps = {
  label?: string;
  selectId: string;
  name: string;
  className?: string;
  disabled?: boolean;
  after?: JSX.Element;
  autoFocus?: boolean;
  children: ComponentChildren;
};

const Select = ({ label, selectId, name, className, disabled, after, autoFocus, children }: SelectProps) => {
  const [field, meta] = useField(name);

  return (
    <SelectBase
      className={clsx(meta.touched && meta.error && "error", className)}
      selectId={selectId}
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
