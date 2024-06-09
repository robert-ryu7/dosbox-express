import { ComponentChildren } from "preact";

type ErrorProps = { children: ComponentChildren };

const Error = (props: ErrorProps) => {
  return <span class="error">Error: {props.children}</span>;
};

export default Error;
