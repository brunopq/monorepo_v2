import type { Route } from "./+types/index"
import { Link, useLoaderData } from "react-router"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { JSX } from "react"

import { Button } from "~/components/ui/button"
import { FormField } from "~/components/Form/FormField"
import { SubmissionStateBadge } from "~/components/ui/badge"

import { loader, type Mode } from "./loader"
import { action } from "./action"
import {
  SubmissionContextProvider,
  useSubmissionContext,
} from "./context"

export { loader, action }

export default function FillForm({ loaderData }: Route.ComponentProps) {
  return (
    <SubmissionContextProvider initialSubmission={loaderData.submission}>
      <div className="grid grid-cols-2 grid-rows-[auto_1fr] place-items-start gap-x-8 gap-y-6">
        {SubmissionPage[loaderData.mode]}
      </div>
    </SubmissionContextProvider>
  )
}

const SubmissionPage: Record<Mode, JSX.Element> = {
  edit:
    <>
      <EditSubmissionHeader />

      <FilledFieldsPreview />

      <FormFields />
    </>,
  review: <><h1>sei la meu kkkkkkkkk</h1></>,
  view:
    <>
      <ViewSubmissionHeader />
      <FilledFieldsPreview />
    </>
}

function ViewSubmissionHeader() {
  const { template } = useSubmissionContext()
  const { submission } = useLoaderData<typeof loader>()

  const canEdit: boolean = true // TODO: check if user can edit

  return (
    <header className="col-span-2 grid w-full grid-cols-[1fr_auto] gap-x-4 border-zinc-700 border-b pb-2">
      <span className="flex items-center gap-2">
        <h1 className="font-semibold text-2xl">
          Ficha{" "}
          <strong className="dark:text-primary-100">{template.name}</strong>
        </h1>

        <SubmissionStateBadge state={submission.state} />
      </span>

      <p className="col-start-1 text-zinc-300">
        Preenchida por{" "}
        <span className="text-zinc-100">
          {submission.submitter?.name || "usuário excluído"}
        </span>{" "}
        em{" "}
        <span className="text-zinc-100">
          {/* biome-ignore lint/style/noNonNullAssertion: <explanation> */}
          {format(submission.submittedAt!, "dd 'de' MMMM, yyyy", {
            locale: ptBR,
          })}
        </span>
      </p>

      {canEdit && (
        <Button className="col-start-2 row-start-1" asChild>
          <Link to={{ search: "?mode=edit" }}>Editar</Link>
        </Button>
      )}
    </header>
  )
}

function EditSubmissionHeader() {
  const { template, sync } = useSubmissionContext()
  const { submission } = useLoaderData<typeof loader>()

  return (
    <header className="col-span-2 flex w-full items-center justify-between">
      <span className="flex items-center gap-2">
        <h1 className="font-semibold text-2xl">
          Preenchendo ficha{" "}
          <strong className="dark:text-primary-100">{template.name}</strong>
        </h1>
        <SubmissionStateBadge state={submission.state} />
      </span>

      <Button onClick={sync}>Salvar</Button>
    </header>
  )
}

function FilledFieldsPreview() {
  const { filledFormFields } = useSubmissionContext()

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
  const { filledFormFields, setFieldValue } = useSubmissionContext()

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
