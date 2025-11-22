import type { Ajv } from "ajv";

export const customErrorMessagePlugin = (ajv: Ajv) => {
  ajv.addKeyword({
    keyword: "errorMessage",
    type: "string",
    schemaType: "string",
    metaSchema: { type: "string" },
  });
  return ajv;
};
