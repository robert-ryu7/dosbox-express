import clsx from "clsx";

type InputProps = JSX.HTMLAttributes<HTMLInputElement> & {
  id?: string;
  inputId: string;
  label?: string;
  className?: string;
  after?: JSX.Element;
  style?: string | JSX.CSSProperties;
  border?: "normal" | "none";
  padding?: "normal" | "big";
};

const Input = ({
  id,
  inputId,
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
    <div id={id} className={finalClassName} style={style}>
      {label && <label for={inputId}>{label}</label>}
      <div className="input__bottom">
        <input type="text" spellcheck={false} id={inputId} {...rest} />
        {after}
      </div>
    </div>
  );
};

export default Input;
