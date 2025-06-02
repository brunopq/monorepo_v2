import { createContext, useContext, useState, type JSX } from "react"
import { useFetcher } from "react-router"

import type { FieldType } from "~/.server/db/schema/fieldType"
import type { TemplateWithFields } from "~/.server/services/TemplateService"

import type { action } from "./action"

export type EditTemplateContext = {
  template: TemplateWithFields

  sync: () => void

  setName: (name: string) => void
  setDescription: (description: string) => void
  addField: () => void
  setFieldName: (id: string, name: string) => void
  setFieldType: (id: string, type: FieldType) => void
  setFieldRequired: (id: string, required: boolean) => void
  removeField: (id: string) => void
}

const editTemplateContext = createContext<EditTemplateContext | null>(null)

export function useEditTemplateContext() {
  const ctx = useContext(editTemplateContext)

  if (!ctx) {
    throw new Error(
      "`useEditTemplateContext` should be used inside the `EditTemplateContextProvider`",
    )
  }

  return ctx
}

type EditTemplateContextProviderProps = {
  children: JSX.Element
  initialTemplate: TemplateWithFields
}

export function EditTemplateContextProvider({
  children,
  initialTemplate,
}: EditTemplateContextProviderProps) {
  const syncFetcher = useFetcher<typeof action>()

  const [template, setTemplate] = useState(initialTemplate)

  function sync() {
    syncFetcher.submit(template, {
      encType: "application/json",
      method: "PUT",
    })
  }

  function setName(name: string) {
    setTemplate((prev) => ({ ...prev, name }))
  }

  function setDescription(description: string) {
    setTemplate((prev) => ({ ...prev, description }))
  }

  function addField() {
    setTemplate((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          templateId: prev.id,
          id: String(Math.random()),
          name: "Campo novo",
          order: prev.fields.length,
          required: false,
          type: "text",
        },
      ],
    }))
  }

  function setFieldName(id: string, name: string) {
    setTemplate((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === id ? { ...f, name } : f)),
    }))
  }

  function setFieldType(id: string, type: FieldType) {
    setTemplate((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === id ? { ...f, type } : f)),
    }))
  }

  function setFieldRequired(id: string, required: boolean) {
    setTemplate((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === id ? { ...f, required } : f)),
    }))
  }

  function removeField(id: string) {
    setTemplate((prev) => ({
      ...prev,
      fields: prev.fields.filter((f) => f.id !== id),
    }))
  }

  return (
    <editTemplateContext.Provider
      value={{
        template,

        sync,

        setName,
        setDescription,
        addField,
        setFieldName,
        setFieldType,
        setFieldRequired,
        removeField,
      }}
    >
      {children}
    </editTemplateContext.Provider>
  )
}
