import * as Yup from "yup";
import tinycolor2 from "tinycolor2";

function color(this: Yup.StringSchema) {
  return this.test(
    "is-color",
    ({ label }) => `${label} is not a valid color`,
    (value) => (value ? tinycolor2(value).isValid() : true)
  );
}
Yup.addMethod(Yup.string, "color", color);
