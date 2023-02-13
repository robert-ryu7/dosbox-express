import clsx from "clsx";

type CheckboxProps = JSX.HTMLAttributes<HTMLInputElement> & {
  id: string;
  label?: string;
  className?: string;
  style?: string | JSX.CSSProperties;
};

const Checkbox = ({ id, label, className, style, ...rest }: CheckboxProps) => {
  return (
    <div className={clsx("checkbox", className)} style={style}>
      {label && <label for={id}>{label}</label>}
      <input type="checkbox" id={id} data-on="ON" data-off="" {...rest} />
    </div>
  );
};

export default Checkbox;
