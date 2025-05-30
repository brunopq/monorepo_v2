import type { Route } from "./+types/index"
import { format } from "date-fns"

import { Button } from "~/components/ui/button"
import { FormField } from "~/components/Form/FormField"

import { loader } from "./loader"
import { action } from "./action"
import {
  EditSubmissionContextProvider,
  useEditSubmissionContext,
} from "./context"

export { loader, action }

// aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
export default function FillForm({ loaderData }: Route.ComponentProps) {
  return (
    <EditSubmissionContextProvider initialSubmission={loaderData}>
      <div className="grid grid-cols-2 grid-rows-[auto_1fr] place-items-start gap-x-8 gap-y-6 rounded-xs border p-8 shadow-lg dark:border-primary-900/50 dark:bg-zinc-800">
        <EditSubmissionHeader />

        <FilledFieldsPreview />

        <FormFields />
      </div>
    </EditSubmissionContextProvider>
  )
}

function EditSubmissionHeader() {
  const { template, sync } = useEditSubmissionContext()

  return (
    <header className="col-span-2 flex w-full items-center justify-between">
      <h1 className="font-semibold text-2xl">
        Preenchendo ficha{" "}
        <strong className="dark:text-primary-100">{template.name}</strong>
      </h1>

      <Button onClick={sync}>Salvar</Button>
    </header>
  )
}

function FilledFieldsPreview() {
  const { filledFormFields } = useEditSubmissionContext()

  return (
    <div className="w-full space-y-4">
      {filledFormFields.map((field) => (
        <div key={field.templateId} className="">
          <span className="font-semibold text-zinc-300">{field.name}: </span>
          {field.value !== undefined && (
            <span className="text-zinc-50">
              {field.type === "date"
                ? format(field.value, "dd/MM/yyyy")
                : field.type === "checkbox"
                  ? field.value
                    ? "Sim"
                    : "Não"
                  : field.value}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function FormFields() {
  const { filledFormFields, setFieldValue } = useEditSubmissionContext()

  return (
    <div className="w-full space-y-4">
      {filledFormFields.map((field) => (
        <FormField
          key={field.templateId}
          field={field}
          setFieldValue={setFieldValue}
        />
      ))}
    </div>
  )
}
