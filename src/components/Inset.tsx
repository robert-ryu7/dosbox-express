import { ComponentChildren } from "preact";
import { MutableRef } from "preact/hooks";

type InsetProps = {
  style?: string | JSX.CSSProperties;
  children: ComponentChildren;
  rootRef?: MutableRef<HTMLDivElement | null>;
};

const Inset = (props: InsetProps) => {
  return (
    <div className="inset" style={props.style} ref={props.rootRef}>
      {props.children}
    </div>
  );
};

export default Inset;
