import { Button, Dialog, Input, Select } from "iboti-ui"
import {
  FieldsMappingModalProvider,
  useFieldsMappingModalContext,
} from "./context"
import { useFetcher } from "react-router"

import { AsteriskIcon, EyeIcon, SparklesIcon, XIcon } from "lucide-react"
import { memo, useCallback, useEffect, useState } from "react"

import type { action as aiRenameAction } from "~/routes/api/prettifyColumns"

import type { FieldMapping, ProcessedFile } from "../types"
import { cn } from "~/utils/styling"

type FieldsMappingModalProps = {
  file: ProcessedFile
  /**
   * The function that should be called to update the file's mappings,
   * submitting the local mappings
   */
  onUpdateMappings: (mappings: FieldMapping[]) => void
}

export function FieldsMappingModal({
  file,
  onUpdateMappings,
}: FieldsMappingModalProps) {
  return (
    <FieldsMappingModalProvider
      onUpdateMappings={onUpdateMappings}
      initialMappings={file.mappings}
      fields={file.headers}
    >
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <Button size="sm" variant="outline">
            Ver colunas
          </Button>
        </Dialog.Trigger>

        <FieldsMappingModalContent fileName={file.file.name} />
      </Dialog.Root>
    </FieldsMappingModalProvider>
  )
}

type FieldsMappingModalContent = {
  fileName: string
}

function FieldsMappingModalContent({ fileName }: FieldsMappingModalContent) {
  const { localMappings, handleUpdateMappings } = useFieldsMappingModalContext()

  return (
    <Dialog.Content className="[--dialog-content-max-width:_38rem]">
      <Dialog.Header>
        <Dialog.Title>Colunas do arquivo {fileName}</Dialog.Title>
      </Dialog.Header>

      <div className="space-y-4">
        {/* <FieldsList fields={file.headers} /> */}

        <div>
          <h3 className="mb-2 font-medium text-sm text-zinc-700">
            Mapeamentos:
          </h3>

          <div className="w-full overflow-hidden rounded-md border border-zinc-300 bg-zinc-100 text-sm text-zinc-700">
            <table className="w-full">
              <thead>
                <tr className="bg-primary-50 font-semibold text-zinc-800">
                  <th className="w-0 px-2 py-1">{/* visibility toggle */}</th>
                  <th className="w-0 px-2 py-1 text-left">Campo</th>
                  <th className="px-2 py-1 text-left">Coluna</th>
                </tr>
              </thead>
              <tbody>
                {localMappings.map((m) => (
                  <AIMapping key={m.name} mappingName={m.name} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Dialog.Close asChild>
          <Button variant="outline">Cancelar</Button>
        </Dialog.Close>
        <Dialog.Close asChild>
          <Button onClick={handleUpdateMappings}>Salvar</Button>
        </Dialog.Close>
      </div>
    </Dialog.Content>
  )
}

type AIMappingProps = {
  mappingName: string
}

const AIMapping = memo(({ mappingName }: AIMappingProps) => {
  const aiRenameFetcher = useFetcher<typeof aiRenameAction>({
    key: mappingName,
  })

  console.log(`Rendering mapping: ${mappingName}`)
  const {
    fields,
    handleSetField,
    handleSetName,
    getMappingByName,
    handleToggleVisibility,
  } = useFieldsMappingModalContext()

  const mapping = getMappingByName(mappingName)

  useEffect(() => {
    const data = aiRenameFetcher.data

    if (!data) return

    if (data.error) {
      // handle error (e.g., show a toast)
      return
    }

    if (data.pretty && mapping) {
      handleSetName(mapping.name, data.pretty)
    }
  }, [aiRenameFetcher.data])

  if (!mapping) return null

  return (
    <tr
      data-visible={mapping.visible}
      className="border-zinc-200 border-b data-[visible=false]:opacity-50"
    >
      <td className="px-2 py-1 align-middle">
        <button
          type="button"
          onClick={() => handleToggleVisibility(mapping.name)}
          title={mapping.visible ? "Ocultar campo" : "Mostrar campo"}
          className="cursor-pointer"
        >
          <EyeIcon className="size-5" />
        </button>
      </td>
      <td className="whitespace-nowrap px-2 py-1 align-middle">
        <span className="flex items-center justify-between gap-1">
          <span
            className={cn(aiRenameFetcher.state !== "idle" && "animate-pulse")}
          >
            {mapping.name}{" "}
            {mapping.mandatory && (
              <AsteriskIcon className="-ml-1 -mt-1 inline size-3.5 text-red-700" />
            )}
          </span>

          <aiRenameFetcher.Form method="POST" action="/api/prettify-column">
            <button
              type="submit"
              name="column"
              value={mapping.field}
              title="Melhorar nome com IA"
              className="group cursor-pointer rounded-full bg-emerald-300/15 p-1.5 transition-colors hover:bg-emerald-200"
            >
              <SparklesIcon className="size-4 stroke-[1.6] text-emerald-800 transition group-hover:rotate-12 group-hover:text-emerald-900" />
            </button>
          </aiRenameFetcher.Form>
        </span>
      </td>
      <td className="px-2 py-1 align-middle">
        <Select.Root
          value={mapping.field || ""}
          onValueChange={(newValue) => handleSetField(mapping.name, newValue)}
        >
          <Select.Trigger size="sm" className="w-fit">
            <Select.Value
              defaultValue={mapping.field}
              placeholder="Selecione uma coluna..."
            />
          </Select.Trigger>

          <Select.Content size="sm">
            {fields.map((field) => (
              <Select.Item key={field} value={field}>
                {field}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </td>
    </tr>
  )
})

type FieldsListProps = {
  fields: string[]
}

function FieldsList({ fields }: FieldsListProps) {
  return (
    <div>
      <h3 className="mb-2 font-medium text-sm text-zinc-700">
        Colunas disponíveis:
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {fields.map((field) => (
          <span
            key={field}
            className="w-max whitespace-nowrap text-xs text-zinc-600 underline"
          >
            {field}
          </span>
        ))}
      </div>
    </div>
  )
}

type MappingProps = {
  mapping: FieldMapping
  fields: string[]
  onValueChange: (value: string) => void
  onRemove: () => void
}

function Mapping({ mapping, fields, onRemove, onValueChange }: MappingProps) {
  return (
    <div className="flex items-center gap-2 border-zinc-400 ">
      <span className="font-medium text-sm">
        {mapping.name}
        {mapping.mandatory && (
          <AsteriskIcon className="-translate-y-1.5 inline size-3 text-red-800" />
        )}
        :
      </span>
      <Select.Root
        value={mapping.field || ""}
        onValueChange={(e) => onValueChange(e)}
      >
        <Select.Trigger size="sm" className="w-fit">
          <Select.Value placeholder="Selecione uma coluna..." />
        </Select.Trigger>

        <Select.Content size="sm">
          {fields.map((header) => (
            <Select.Item key={header} value={header}>
              {header}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>

      <Button
        type="button"
        size="icon"
        variant="destructive"
        onClick={onRemove}
        className="ml-auto size-6 bg-transparent text-red-600 shadow-none hover:text-red-900"
      >
        <XIcon className="size-4" />
      </Button>
    </div>
  )
}

type NewMappingFormProps = {
  onAdd: (key: string, value: string) => void
  fields: string[]
}

function NewMappingForm({ onAdd, fields }: NewMappingFormProps) {
  const [newMappingKey, setNewMappingKey] = useState("")
  const [newMappingValue, setNewMappingValue] = useState("")

  return (
    <>
      <h4 className="mb-2 font-medium text-sm text-zinc-700">
        Adicionar novo mapeamento:
      </h4>
      <div className="flex gap-2">
        <Input
          placeholder="Nome do campo"
          value={newMappingKey}
          onChange={(e) => setNewMappingKey(e.target.value)}
          className="flex-1"
        />
        <Select.Root value={newMappingValue} onValueChange={setNewMappingValue}>
          <Select.Trigger className="w-fit">
            <Select.Value placeholder="Selecione uma coluna..." />
          </Select.Trigger>

          <Select.Content>
            {fields.map((field) => (
              <Select.Item key={field} value={field}>
                {field}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            onAdd(newMappingKey, newMappingValue)
            setNewMappingKey("")
            setNewMappingValue("")
          }}
          disabled={!newMappingKey.trim() || !newMappingValue}
        >
          Adicionar
        </Button>
      </div>
    </>
  )
}
