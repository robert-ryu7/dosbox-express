import { ComponentChildren } from "preact";

type OutsetHeadProps = {
  children: ComponentChildren;
};

const OutsetHead = (props: OutsetHeadProps) => {
  return <div className="outset-head">{props.children}</div>;
};

export default OutsetHead;
