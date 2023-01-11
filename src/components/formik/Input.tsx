import clsx from "clsx";
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
    <div className={clsx("input", meta.touched && meta.error && "error", className)}>
      <label for={id}>{label}</label>
      <div className="input__bottom">
        <input type="text" id={id} placeholder={placeholder} disabled={disabled} {...field} />
        {after}
      </div>
    </div>
  );
};

export default Input;
