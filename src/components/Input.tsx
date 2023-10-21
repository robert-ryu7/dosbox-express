import clsx from "clsx";

type InputProps = JSX.HTMLAttributes<HTMLInputElement> & {
  id: string;
  componentId?: string;
  label?: string;
  className?: string;
  after?: JSX.Element;
  style?: string | JSX.CSSProperties;
  border?: "normal" | "none";
  padding?: "normal" | "big";
};

const Input = ({
  id,
  componentId,
  label,
  className,
  after,
  style,
  border = "normal",
  padding = "normal",
  ...rest
}: InputProps) => {
  const finalClassName = clsx(
    "input",
    border === "none" && "input--border-none",
    padding === "big" && "input--padding-big",
    className,
  );

  return (
    <div id={componentId} className={finalClassName} style={style}>
      {label && <label for={id}>{label}</label>}
      <div className="input__bottom">
        <input type="text" spellcheck={false} id={id} {...rest} />
        {after}
      </div>
    </div>
  );
};

export default Input;
