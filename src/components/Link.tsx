import clsx from "clsx";

type LinkProps = Omit<JSX.HTMLAttributes<HTMLAnchorElement>, "target">;

const Link = ({ className, ...rest }: LinkProps) => {
  return <a className={clsx("link", className)} target="_blank" {...rest} />;
};

export default Link;
