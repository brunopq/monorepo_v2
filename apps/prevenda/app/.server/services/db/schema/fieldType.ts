import { pgEnum } from "drizzle-orm/pg-core"

const fieldTypesArray = [
  "text",
  "textarea",
  "number",
  "date",
  "checkbox",
  // "radio",
  // "select",
] as const

export type FieldType = (typeof fieldTypesArray)[number]

export const fieldTypes = pgEnum("field_types", fieldTypesArray)
