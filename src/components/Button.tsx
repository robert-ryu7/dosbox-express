import clsx from "clsx";

type ButtonProps = JSX.HTMLAttributes<HTMLButtonElement>;

const Button = ({
  children,
  className,
  type = "button",
  ...rest
}: ButtonProps) => (
  <button className={clsx("button", className)} type={type} {...rest}>
    <div class="button__content">{children}</div>
  </button>
);

export default Button;
