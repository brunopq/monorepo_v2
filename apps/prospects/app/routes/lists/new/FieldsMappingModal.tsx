import { Button, Dialog, Input, Select } from "iboti-ui"
import { XIcon } from "lucide-react"
import { useState } from "react"

import type { ProcessedFile } from "./types"

type FieldsMappingModalProps = {
  file: ProcessedFile
}

export function FieldsMappingModal({ file }: FieldsMappingModalProps) {
  const [localMapping, setLocalMapping] = useState<
    Partial<Record<string, string | undefined>>
  >(file.mapping)

  const handleAddMapping = (key: string, value: string) => {
    setLocalMapping((prev) => ({
      ...prev,
      [key.trim()]: value,
    }))
  }

  const removeMapping = (key: string) => {
    setLocalMapping((prev) => {
      const newMapping = { ...prev }
      delete newMapping[key]
      return newMapping
    })
  }

  const saveMappings = () => {
    file.mapping = localMapping
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button size="sm" variant="outline">
          Ver colunas
        </Button>
      </Dialog.Trigger>

      <Dialog.Content className="[--dialog-content-max-width:_38rem]">
        <Dialog.Header>
          <Dialog.Title>Colunas do arquivo {file.file.name}</Dialog.Title>
        </Dialog.Header>

        <div className="space-y-4">
          <FieldsList fields={file.headers} />

          <div>
            <h3 className="mb-2 font-medium text-sm text-zinc-700">
              Mapeamentos:
            </h3>

            {Object.entries(localMapping).length > 0 ? (
              <div className="mb-3 max-h-96 space-y-2 overflow-scroll">
                {Object.entries(localMapping).map(([key, value]) => (
                  <Mapping
                    key={key}
                    mappingKey={key}
                    value={value}
                    fields={file.headers}
                    onValueChange={(newValue) =>
                      setLocalMapping((prev) => ({
                        ...prev,
                        [key]: newValue,
                      }))
                    }
                    onRemove={() => removeMapping(key)}
                  />
                ))}
              </div>
            ) : (
              <p className="mb-3 text-sm text-zinc-500">
                Nenhum mapeamento criado
              </p>
            )}

            <div className="mt-6">
              <NewMappingForm fields={file.headers} onAdd={handleAddMapping} />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Dialog.Close asChild>
            <Button variant="outline">Cancelar</Button>
          </Dialog.Close>
          <Dialog.Close asChild>
            <Button onClick={saveMappings}>Salvar</Button>
          </Dialog.Close>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  )
}

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
  mappingKey: string | undefined
  value: string | undefined
  fields: string[]
  onValueChange: (value: string) => void
  onRemove: () => void
  required?: boolean
}

function Mapping({
  mappingKey,
  value,
  fields,
  onRemove,
  onValueChange,
  required,
}: MappingProps) {
  return (
    <div className="flex items-center gap-2 border-zinc-400 ">
      <span className="font-medium text-sm">
        {mappingKey}
        {required && <span className="text-red-800">*</span>}:
      </span>
      <Select.Root value={value || ""} onValueChange={(e) => onValueChange(e)}>
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
