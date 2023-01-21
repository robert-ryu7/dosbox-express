type DividerProps = {
  style?: string | JSX.CSSProperties;
};

const Divider = (props: DividerProps) => {
  return <div className="divider" style={props.style} />;
};

export default Divider;
