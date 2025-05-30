export type FillableFormField = Omit<FormField, "formTemplateId"> & {
  value: string | number | boolean
}

type FormFillingContext = {
  fields: FillableFormField[]
  setField: (fieldId: string, fieldData: Partial<FillableFormField>) => void
}
