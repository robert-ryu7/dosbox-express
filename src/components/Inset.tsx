import { ComponentChildren } from "preact";

type InsetProps = {
  style?: string | JSX.CSSProperties;
  children: ComponentChildren;
};

const Inset = (props: InsetProps) => {
  return (
    <div className="inset" style={props.style}>
      {props.children}
    </div>
  );
};

export default Inset;
