import { Ref, ComponentChildren } from "preact";
import { useEffect, useRef } from "preact/hooks";

type DialogProps = {
  show: boolean;
  onHide: () => void;
  children: ComponentChildren;
};

const Dialog = (props: DialogProps) => {
  const elementRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    elementRef.current?.addEventListener("close", props.onHide);

    return () => elementRef.current?.removeEventListener("close", props.onHide);
  }, [props.onHide]);

  useEffect(() => {
    if (props.show) {
      elementRef.current?.showModal?.();
    } else {
      elementRef.current?.close();
    }
  }, [props.show]);

  return (
    <dialog class="dialog" ref={elementRef}>
      {props.children}
    </dialog>
  );
};

export default Dialog;
