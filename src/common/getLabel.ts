import * as Yup from "yup";

const getLabel = (schema: Yup.Schema, path: string) => {
  const targetSchema = Yup.reach(schema, path);

  if (targetSchema instanceof Yup.Schema) return targetSchema.spec.label;
};

export default getLabel;
