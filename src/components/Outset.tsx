import { ComponentChildren } from "preact";

type OutsetProps = {
  style?: string | JSX.CSSProperties;
  children: ComponentChildren;
};

const Outset = (props: OutsetProps) => {
  return (
    <div className="outset" style={props.style}>
      {props.children}
    </div>
  );
};

export default Outset;
