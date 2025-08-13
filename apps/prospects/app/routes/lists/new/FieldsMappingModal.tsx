import { Button, Dialog, Input, Select } from "iboti-ui"
import { AsteriskIcon, XIcon } from "lucide-react"
import { useState } from "react"

import type { FieldMapping, ProcessedFile } from "./types"

type FieldsMappingModalProps = {
  file: ProcessedFile
  onUpdateMappings: (mappings: FieldMapping[]) => void
}

export function FieldsMappingModal({
  file,
  onUpdateMappings,
}: FieldsMappingModalProps) {
  const [localMappings, setLocalMappings] = useState<FieldMapping[]>(
    file.mappings,
  )

  const handleAddMapping = (name: string, field: string) => {
    setLocalMappings((prev) => [...prev, { name, field }])
  }

  const removeMapping = (name: string) => {
    setLocalMappings((prev) => prev.filter((mapping) => mapping.name !== name))
  }

  const saveMappings = () => {
    onUpdateMappings(localMappings)
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

            {localMappings.length > 0 ? (
              <div className="mb-3 max-h-96 space-y-2 overflow-scroll">
                {localMappings.map((m) => (
                  <Mapping
                    key={m.name}
                    mapping={m}
                    fields={file.headers}
                    onValueChange={(newValue) =>
                      setLocalMappings((prev) =>
                        prev.map((mapping) =>
                          mapping.name === m.name
                            ? { ...mapping, field: newValue }
                            : mapping,
                        ),
                      )
                    }
                    onRemove={() => removeMapping(m.name)}
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
