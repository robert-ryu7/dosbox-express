import clsx from "clsx";

type TextAreaProps = JSX.HTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  label: string;
  className?: string;
  after?: JSX.Element;
};

const TextArea = ({ id, label, className, after, ...rest }: TextAreaProps) => {
  return (
    <div className={clsx("text-area", className)}>
      <label for={id}>{label}</label>
      <div className="text-area__bottom">
        <textarea id={id} spellcheck={false} {...rest} />
        {after}
      </div>
    </div>
  );
};

export default TextArea;
