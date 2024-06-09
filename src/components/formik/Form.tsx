import { useFormikContext } from "formik";
import { ComponentChildren } from "preact";
import * as api from "../../common/api";
import { N } from "../../common/constants";

type FormProps = {
  children: ComponentChildren;
  style?: string | JSX.CSSProperties;
};

const Form = (props: FormProps) => {
  const formik = useFormikContext();

  const handleSubmit: JSX.GenericEventHandler<HTMLFormElement> = async (event) => {
    if (!formik.isValid) {
      event.preventDefault();
      const text = ["Cannot continue due to errors:"]
        .concat(...Object.values(formik.errors).map((error) => `• ${String(error)}`))
        .join(N);

      await api.error(text);
    }
    formik.handleSubmit(event);
  };

  return (
    <form autoComplete="off" onReset={formik.handleReset} onSubmit={handleSubmit} action="#" style={props.style}>
      {props.children}
    </form>
  );
};

export default Form;
