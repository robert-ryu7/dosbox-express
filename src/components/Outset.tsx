import { ComponentChildren } from "preact";
import { MutableRef } from "preact/hooks";

type OutsetProps = {
  id?: string;
  style?: string | JSX.CSSProperties;
  children?: ComponentChildren;
  rootRef?: MutableRef<HTMLDivElement | null>;
};

const Outset = (props: OutsetProps) => {
  return (
    <div id={props.id} className="outset" style={props.style} ref={props.rootRef}>
      {props.children}
    </div>
  );
};

export default Outset;
