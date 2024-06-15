import clsx from "clsx";
import { ComponentChildren } from "preact";

type ErrorMessageProps = { children: ComponentChildren; className?: string; style?: string | JSX.CSSProperties };

const ErrorMessage = (props: ErrorMessageProps) => {
  return (
    <span className={clsx("error-message", props.className)} style={props.style}>
      ERROR: {props.children}
    </span>
  );
};

export default ErrorMessage;
