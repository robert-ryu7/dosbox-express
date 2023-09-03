import clsx from "clsx";
import { ComponentChildren } from "preact";

type SelectProps = JSX.HTMLAttributes<HTMLSelectElement> & {
  selectId: string;
  label?: string;
  className?: string;
  after?: JSX.Element;
  style?: string | JSX.CSSProperties;
  children: ComponentChildren;
};

const Select = ({ selectId, label, className, after, style, children, ...rest }: SelectProps) => {
  const finalClassName = clsx("select", className);

  return (
    <div className={finalClassName} style={style}>
      {label && <label for={selectId}>{label}</label>}
      <div className="select__bottom">
        <select id={selectId} {...rest}>
          {children}
        </select>
        {after}
      </div>
    </div>
  );
};

export default Select;
