import type { Route } from "./+types"
import { useFetcher } from "react-router"
import { createContext, useContext, useState, type JSX } from "react"

import type { SubmittedField } from "~/.server/services/db/schema/submission"
import type { TemplateField } from "~/.server/services/db/schema/template"
import type { TemplateWithFields } from "~/.server/services/TemplateService"

import type { FieldWithValue } from "~/components/Form/FormField"

import type { action } from "./action"

type EditSubmissionContext = {
  template: TemplateWithFields
  filledFormFields: FieldWithValue[]

  sync: () => void

  setFieldValue: (id: string, value: FieldWithValue["value"]) => void
}

const editSubmissionContext = createContext<EditSubmissionContext | null>(null)

export function useEditSubmissionContext() {
  const ctx = useContext(editSubmissionContext)

  if (!ctx) {
    throw new Error(
      "`useEditSubmissionContext` should be used inside the `EditSubmissionContextProvider`",
    )
  }

  return ctx
}
const toDomain = (
  submissionField: SubmittedField,
  templateField: TemplateField,
): FieldWithValue => {
  const baseField: TemplateField = {
    ...templateField,
  }

  if (templateField.type === "checkbox") {
    return {
      ...baseField,
      type: "checkbox",
      value: submissionField.checkboxValue ?? undefined,
    }
  }
  if (templateField.type === "date") {
    return {
      ...baseField,
      type: "date",
      value: submissionField.dateValue ?? undefined,
    }
  }
  if (templateField.type === "number") {
    return {
      ...baseField,
      type: "number",
      value: submissionField.numberValue ?? undefined,
    }
  }
  if (templateField.type === "text") {
    return {
      ...baseField,
      type: "text",
      value: submissionField.textValue ?? undefined,
    }
  }
  if (templateField.type === "textarea") {
    return {
      ...baseField,
      type: "textarea",
      value: submissionField.textareaValue ?? undefined,
    }
  }
  throw new Error("unreachable")
}

type EditSubmissionContextProviderProps = {
  initialSubmission: Route.ComponentProps["loaderData"]
  children: JSX.Element
}

export function EditSubmissionContextProvider({
  initialSubmission,
  children,
}: EditSubmissionContextProviderProps) {
  const syncFetcher = useFetcher<typeof action>()

  const [template, _] = useState(initialSubmission.template)
  const [filledFormFields, setFilledFormFields] = useState<FieldWithValue[]>(
    initialSubmission.template.fields.map((templateField) => {
      const submissionField = initialSubmission.submittedFields.find(
        (s) => s.templateFieldId === templateField.id,
      )

      if (!submissionField) {
        return { ...templateField, value: undefined }
      }

      return toDomain(submissionField, templateField)
    }),
  )

  const toPersistance = (field: FieldWithValue): SubmittedField => {
    const syncField: SubmittedField = {
      templateFieldId: field.id,
      submissionId: initialSubmission.id,
      checkboxValue: null,
      dateValue: null,
      numberValue: null,
      textValue: null,
      textareaValue: null,
    }

    if (field.value === undefined) return syncField

    switch (field.type) {
      case "text":
        syncField.textValue = field.value
        break
      case "textarea":
        syncField.textareaValue = field.value
        break
      case "number":
        syncField.numberValue = field.value
        break
      case "date":
        syncField.dateValue = field.value
        break
      case "checkbox":
        syncField.checkboxValue = field.value
        break
    }

    return syncField
  }

  const sync = () => {
    const payload = filledFormFields.map(toPersistance)
    syncFetcher.submit(JSON.stringify(payload), {
      method: "POST",
      encType: "application/json",
    })
  }

  const setFieldValue: EditSubmissionContext["setFieldValue"] = (id, value) => {
    setFilledFormFields((prev) =>
      prev.map((field) => {
        if (field.id === id) {
          if (
            (field.type === "text" || field.type === "textarea") &&
            typeof value === "string"
          ) {
            return { ...field, value }
          }
          if (field.type === "number" && typeof value === "number") {
            return { ...field, value }
          }
          if (field.type === "date" && value instanceof Date) {
            return { ...field, value }
          }
          if (field.type === "checkbox" && typeof value === "boolean") {
            return { ...field, value }
          }
        }
        return field
      }),
    )
  }

  return (
    <editSubmissionContext.Provider
      value={{
        template,
        filledFormFields,

        sync,
        setFieldValue,
      }}
    >
      {children}
    </editSubmissionContext.Provider>
  )
}
