import clsx from "clsx";

type InputProps = JSX.HTMLAttributes<HTMLInputElement> & {
  id: string;
  label?: string;
  className?: string;
  after?: JSX.Element;
  style?: string | JSX.CSSProperties;
};

const Input = ({ id, label, className, after, style, ...rest }: InputProps) => {
  return (
    <div className={clsx("input", className)} style={style}>
      {label && <label for={id}>{label}</label>}
      <div className="input__bottom">
        <input type="text" spellcheck={false} id={id} {...rest} />
        {after}
      </div>
    </div>
  );
};

export default Input;
