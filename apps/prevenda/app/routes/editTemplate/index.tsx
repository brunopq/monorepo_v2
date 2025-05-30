import type { Route } from "./+types/index"
import { memo, useState, type JSX } from "react"
import { Select } from "radix-ui"
import {
  CalendarFoldIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronDownIcon,
  FileDigitIcon,
  LetterTextIcon,
  PencilIcon,
  ScrollTextIcon,
  Trash2Icon,
} from "lucide-react/icons"

import type { FieldType } from "~/.server/services/db/schema/fieldType"
import type { TemplateField } from "~/.server/services/db/schema/template"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"

import { EditTemplateContextProvider, useEditTemplateContext } from "./context"
import { action } from "./action"
import { loader } from "./loader"
import { FormField } from "~/components/Form/FormField"

export { action, loader }

export default function EditTemplate({ loaderData }: Route.ComponentProps) {
  const { template } = loaderData

  return (
    <EditTemplateContextProvider initialTemplate={{ ...template }}>
      <div /*className="rounded-xs border p-8 shadow-lg dark:border-primary-900/50 dark:bg-zinc-800"*/
      >
        <EditTemplateHeader />

        <div>
          <EditTemplateInfo />

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <h3 className="mb-4 font-semibold text-xl">Campos</h3>

              <EditableFields />
            </div>

            <div className="min-w-0">
              <h3 className="mb-4 font-semibold text-xl">Prévia</h3>

              <div className="space-y-4">
                <TemplatePreview />
              </div>
            </div>
          </div>
        </div>
      </div>
    </EditTemplateContextProvider>
  )
}

function EditTemplateHeader() {
  const { sync } = useEditTemplateContext()

  return (
    <header className="mb-8 flex items-center justify-between">
      <h1 className="font-semibold text-2xl">Novo template</h1>

      <Button onClick={sync}>Salvar</Button>
    </header>
  )
}

function EditTemplateInfo() {
  const { template, setName, setDescription } = useEditTemplateContext()

  return (
    <div className="grid grid-cols-2 gap-4">
      <label>
        <span>Nome</span>
        <Input
          value={template.name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome..."
          type="text"
        />
      </label>

      <label>
        <span>Descrição</span>
        <Input
          value={template.description || ""}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descição..."
          type="text"
        />
      </label>
    </div>
  )
}

const EditableFields = memo(() => {
  const { template, addField } = useEditTemplateContext()
  return (
    <>
      <div className="space-y-4">
        {template.fields.map((field) => (
          <EditableField key={field.id} field={field} />
        ))}
      </div>

      <Button className="mt-8" onClick={addField}>
        Adicionar campo
      </Button>
    </>
  )
})

type FieldProps = { field: TemplateField }

const EditableField = memo(({ field }: FieldProps) => {
  const { setFieldRequired, removeField } = useEditTemplateContext()

  return (
    <div className="grid max-w-md grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 overflow-hidden rounded-sm border border-zinc-300 px-2 py-1 shadow-sm dark:border-zinc-800">
      <strong className="text-sm text-zinc-500 dark:text-zinc-400">
        Campo:
      </strong>

      <NameInput id={field.id} name={field.name} />

      <strong className="text-sm text-zinc-500 dark:text-zinc-400">
        Tipo:
      </strong>

      <div className="group flex items-center gap-2">
        <TypeSelect id={field.id} value={field.type} />
      </div>

      <strong className="text-sm text-zinc-500 dark:text-zinc-400">
        Obrigatório:
      </strong>
      <div className="flex items-center justify-between gap-2">
        <label className="flex w-fit select-none items-center gap-2 rounded-md px-2 py-0.5 transition-colors hover:bg-zinc-300 dark:hover:bg-zinc-800">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => setFieldRequired(field.id, e.target.checked)}
            className=""
          />
          {field.required ? "Sim" : "Não"}
        </label>

        <button
          type="button"
          onClick={() => removeField(field.id)}
          className="group flex cursor-pointer items-center gap-2 rounded-sm p-0.5 pl-2 text-red-400 text-sm transition-colors *:transition-all hover:bg-red-200 hover:text-red-700 dark:text-red-700 dark:hover:bg-red-900 dark:hover:text-red-200"
        >
          <span className="opacity-0 transition group-hover:opacity-100">
            Remover
          </span>
          <Trash2Icon className="size-4" />
        </button>
      </div>
    </div>
  )
})

const typeMap: Record<TemplateField["type"], JSX.Element> = {
  text: (
    <div className="flex items-center gap-2">
      <span>Texto</span>
      <LetterTextIcon className="size-4" />
    </div>
  ),
  textarea: (
    <div className="flex items-center gap-2">
      <span>Texto grande</span>
      <ScrollTextIcon className="size-4" />
    </div>
  ),
  number: (
    <div className="flex items-center gap-2">
      <span>Número</span>
      <FileDigitIcon className="size-4" />
    </div>
  ),
  date: (
    <div className="flex items-center gap-2">
      <span>Data</span>
      <CalendarFoldIcon className="size-4" />
    </div>
  ),
  checkbox: (
    <div className="flex items-center gap-2">
      <span>Checkbox</span>
      <CheckCircle2Icon className="size-4" />
    </div>
  ),
}

type TypeSelectProps = {
  id: string
  value: TemplateField["type"]
}

function TypeSelect({ id, value }: TypeSelectProps) {
  const { setFieldType } = useEditTemplateContext()

  return (
    <Select.Root
      onValueChange={(value) => setFieldType(id, value as FieldType)}
      value={value}
    >
      <Select.Trigger className="group flex items-center justify-between gap-4 rounded-md px-2 py-0.5 outline-0 transition-colors hover:bg-zinc-300 focus-visible:bg-zinc-300 data-[state='open']:bg-zinc-300 dark:data-[state='open']:bg-zinc-800 dark:focus-visible:bg-zinc-800 dark:hover:bg-zinc-800">
        <Select.Value placeholder="Selecione..." />
        <Select.Icon className="">
          <ChevronDownIcon className="size-0 transition-all group-hover:size-5 group-focus:size-5 group-data-[state='open']:size-5" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          className="mt-2 space-y-0.5 rounded-md border border-zinc-400/50 bg-zinc-300 p-0.5 shadow-md dark:border-zinc-700/50 dark:bg-zinc-800"
        >
          {Object.entries(typeMap).map(([key, value]) => (
            <Select.Item
              className="rounded-sm px-1 py-0.5 outline-0 transition-colors hover:bg-zinc-400 data-[state='checked']:bg-primary-400 data-[state='checked']:hover:bg-primary-500 dark:data-[state='checked']:bg-primary-700/50 dark:hover:bg-zinc-700 dark:hover:data-[state='checked']:bg-primary-800"
              key={key}
              value={key}
            >
              <Select.ItemText>{value}</Select.ItemText>
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

type NameInputProps = {
  id: string
  name: string
}

function NameInput({ id, name }: NameInputProps) {
  const [isEditing, setIsEditing] = useState(false)
  const { setFieldName } = useEditTemplateContext()

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        type="button"
        className="group flex min-w-0 max-w-full cursor-pointer items-center gap-2 rounded-md px-2 py-0.5 outline-0 hover:bg-zinc-300 focus-visible:bg-zinc-300 dark:focus-visible:bg-zinc-800 dark:hover:bg-zinc-800"
      >
        <span className="overflow-hidden overflow-ellipsis">{name}</span>
        <div>
          <PencilIcon className="size-0 transition-all group-hover:size-4" />
        </div>
      </button>
    )
  }

  return (
    <div className="flex w-full rounded-md bg-primary-300 p-0.5 pl-2 dark:bg-primary-800/50 ">
      <input
        className="flex-1 outline-0"
        type="text"
        value={name}
        onChange={(e) => {
          setFieldName(id, e.target.value)
        }}
        onBlur={() => setIsEditing(false)}
      />
      <button
        type="button"
        className="cursor-pointer rounded-sm bg-zinc-400/25 p-1 transition-colors hover:bg-zinc-400/50"
        onClick={() => setIsEditing(false)}
      >
        <CheckIcon className="size-4" />
      </button>
    </div>
  )
}

function TemplatePreview() {
  const { template } = useEditTemplateContext()

  return template.fields.map((field) => (
    <FormField
      key={field.id}
      field={{ ...field, value: undefined }}
      setFieldValue={() => {}}
    />
  ))
}
