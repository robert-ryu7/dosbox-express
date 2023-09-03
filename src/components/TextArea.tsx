import clsx from "clsx";

type TextAreaProps = JSX.HTMLAttributes<HTMLTextAreaElement> & {
  textareaId: string;
  label: string;
  className?: string;
  after?: JSX.Element;
};

const TextArea = ({ textareaId, label, className, after, ...rest }: TextAreaProps) => {
  return (
    <div className={clsx("text-area", className)}>
      <label for={textareaId}>{label}</label>
      <div className="text-area__bottom">
        <textarea id={textareaId} spellcheck={false} {...rest} />
        {after}
      </div>
    </div>
  );
};

export default TextArea;
