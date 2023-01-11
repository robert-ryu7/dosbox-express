import { Ref, ComponentChildren } from "preact";

type DialogProps = {
  dialogRef: Ref<HTMLDialogElement>;
  children: ComponentChildren;
};

const Dialog = (props: DialogProps) => {
  return (
    <dialog class="dialog" ref={props.dialogRef}>
      {props.children}
    </dialog>
  );
};

export default Dialog;
