import clsx from "clsx";

type InlineButtonProps = JSX.HTMLAttributes<HTMLButtonElement>;

const InlineButton = ({ className, type = "button", ...rest }: InlineButtonProps) => {
  return <button type={type} className={clsx("inline-button", className)} {...rest} />;
};

export default InlineButton;
