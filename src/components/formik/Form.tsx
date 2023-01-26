import { message } from "@tauri-apps/api/dialog";
import { useFormikContext } from "formik";
import { ComponentChildren } from "preact";

type FormProps = {
  children: ComponentChildren;
  style?: string | JSX.CSSProperties;
};

const Form = (props: FormProps) => {
  const formik = useFormikContext();

  return (
    <form
      autoComplete="off"
      onReset={formik.handleReset}
      onSubmit={(e?: any) => {
        if (!formik.isValid) {
          let text = ["Cannot continue due to errors:"]
            .concat(...Object.values(formik.errors).map((error) => `• ${error}`))
            .join("\n");

          message(text, { type: "error" });
        }
        formik.handleSubmit(e);
      }}
      action="#"
      style={props.style}
    >
      {props.children}
    </form>
  );
};

export default Form;
