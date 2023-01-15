import clsx from "clsx";

type InputProps = JSX.HTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  className?: string;
  after?: JSX.Element;
};

const Input = ({ id, label, className, after, ...rest }: InputProps) => {
  return (
    <div className={clsx("input", className)}>
      <label for={id}>{label}</label>
      <div className="input__bottom">
        <input type="text" id={id} {...rest} />
        {after}
      </div>
    </div>
  );
};

export default Input;
