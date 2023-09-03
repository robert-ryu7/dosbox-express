import clsx from "clsx";

type CheckboxProps = JSX.HTMLAttributes<HTMLInputElement> & {
  inputId: string;
  label?: string;
  className?: string;
  style?: string | JSX.CSSProperties;
};

const Checkbox = ({ inputId, label, className, style, ...rest }: CheckboxProps) => {
  return (
    <div className={clsx("checkbox", className)} style={style}>
      {label && <label for={inputId}>{label}</label>}
      <input type="checkbox" id={inputId} data-on="ON" data-off="" {...rest} />
    </div>
  );
};

export default Checkbox;
