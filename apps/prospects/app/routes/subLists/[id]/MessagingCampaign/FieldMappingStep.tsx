import { useLoaderData } from "react-router"
import { useEffect } from "react"
import { Button, DropdownMenu, Input, Select, Tooltip } from "iboti-ui"
import { EllipsisVerticalIcon, PlusIcon } from "lucide-react"

import { useCreateCampaignContext } from "./context"
import type { loader } from ".."
import type { FieldMapping, Mapping, MappingVariants } from "./types"

export function FieldMappingStep() {
  const { headers } = useLoaderData<typeof loader>()

  const { selectedTemplate, mappings, onAddMapping } =
    useCreateCampaignContext()

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!selectedTemplate) return

    onAddMapping({
      id: crypto.randomUUID(),
      name: "Telefone",
      mappings: [{ id: crypto.randomUUID(), type: "simple", column: null }],
      mapperFn: null,
    })

    for (const param of selectedTemplate.parameterNames) {
      onAddMapping({
        id: crypto.randomUUID(),
        name: param,
        mappings: [{ id: crypto.randomUUID(), type: "simple", column: null }],
        mapperFn: null,
      })
    }
  }, [selectedTemplate])

  if (!selectedTemplate) {
    return "invalid state"
  }

  const phoneMapping = mappings.find((m) => m.name === "Telefone")

  if (!phoneMapping) {
    return "Carregando mapeamento de telefone..."
  }

  const templateMappings = mappings.filter((m) => m.name !== "Telefone")

  return (
    <>
      <div className="mb-6">
        <p>Colunas da lista:</p>
        <div className="flex gap-2 overflow-x-auto">
          {headers.map((h) => (
            <span
              key={h}
              className="select-none text-nowrap rounded-sm bg-accent-300 px-2 py-0.5 font-medium text-accent-900 text-sm"
            >
              {h}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <p className="mb-1">Campos padrão:</p>
        <FieldMappingInput fieldMapping={phoneMapping} />
      </div>

      <div>
        <p className="mb-1">Campos da mensagem:</p>
        {templateMappings.length > 0 ? (
          <div className="space-y-4">
            {templateMappings.map((m) => (
              <span key={m.id} className="flex items-center gap-2">
                <strong className="font-semibold text-primary-800">
                  {m.name}:{" "}
                </strong>

                <SimplePhoneSelector
                  key={m.id}
                  fieldMappingId={m.id}
                  mapping={m.mappings[0]}
                />
              </span>
            ))}
          </div>
        ) : (
          <p>Nenhum campo para mapear</p>
        )}
      </div>
    </>
  )
}

type FieldMappingInputProps = {
  fieldMapping: FieldMapping
}

function FieldMappingInput({ fieldMapping }: FieldMappingInputProps) {
  const { onAddMappingToField } = useCreateCampaignContext()

  const handleNewMapping = () => {
    onAddMappingToField(fieldMapping.id, {
      id: crypto.randomUUID(),
      type: "simple",
      column: null,
    })
  }

  return (
    <span className="flex gap-2">
      <strong className="font-semibold text-primary-800">
        {fieldMapping.name}:{" "}
      </strong>

      <div className="flex-1 space-y-2">
        {fieldMapping.mappings.map((mapping) => (
          <MappingInput
            key={mapping.id}
            fieldMappingId={fieldMapping.id}
            mapping={mapping}
          />
        ))}

        <Button
          onClick={handleNewMapping}
          className="w-full"
          size="sm"
          variant="background"
        >
          Adicionar
        </Button>
      </div>
    </span>
  )
}

type MappingInputProps = {
  fieldMappingId: string
  mapping: Mapping
}

function MappingInput({ fieldMappingId, mapping }: MappingInputProps) {
  const { onUpdateMappingInField, onRemoveMappingFromField } =
    useCreateCampaignContext()

  const handleTypeChange = (type: MappingVariants) => {
    let updatedMapping: Mapping

    switch (type) {
      case "simple":
        updatedMapping = { id: mapping.id, type: "simple", column: null }
        break
      case "merge":
        updatedMapping = { id: mapping.id, type: "merge", columns: [null] }
        break
      case "split":
        updatedMapping = {
          id: mapping.id,
          type: "split",
          column: null,
          separators: "",
        }
        break
    }

    onUpdateMappingInField(fieldMappingId, mapping.id, updatedMapping)
  }

  const handleRemove = () => {
    onRemoveMappingFromField(fieldMappingId, mapping.id)
  }

  return (
    <span className="flex items-center gap-1">
      {mapping.type === "simple" && (
        <SimplePhoneSelector
          fieldMappingId={fieldMappingId}
          mapping={mapping}
        />
      )}
      {mapping.type === "merge" && (
        <MergePhoneSelector fieldMappingId={fieldMappingId} mapping={mapping} />
      )}
      {mapping.type === "split" && (
        <SplitPhoneSelector fieldMappingId={fieldMappingId} mapping={mapping} />
      )}

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button icon size="sm" variant="background">
            <EllipsisVerticalIcon className="size-5 text-zinc-600" />
          </Button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content>
          <DropdownMenu.Item variant="danger" onSelect={handleRemove}>
            Remover
          </DropdownMenu.Item>

          <DropdownMenu.Separator />

          <DropdownMenu.RadioGroup
            value={mapping.type}
            onValueChange={(val) => {
              handleTypeChange(val as MappingVariants)
            }}
          >
            <DropdownMenu.Label>Modo de seleção</DropdownMenu.Label>
            <DropdownMenu.RadioItem value="simple">
              Simples
            </DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="merge">
              Mesclar
            </DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="split">
              Dividir
            </DropdownMenu.RadioItem>
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </span>
  )
}

type SelectorProps = {
  fieldMappingId: string
  mapping: Mapping
}

function SimplePhoneSelector({ fieldMappingId, mapping }: SelectorProps) {
  const { headers } = useLoaderData<typeof loader>()
  const { onUpdateMappingInField } = useCreateCampaignContext()

  if (mapping.type !== "simple") return null

  const handleChange = (column: string) => {
    onUpdateMappingInField(fieldMappingId, mapping.id, { ...mapping, column })
  }

  return (
    <Select.Root value={mapping.column || ""} onValueChange={handleChange}>
      <Select.Trigger size="sm">
        <Select.Value placeholder="Selecione..." />
      </Select.Trigger>
      <Select.Content size="sm">
        {headers.map((h) => (
          <Select.Item key={h} value={h}>
            {h}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  )
}

function MergePhoneSelector({ fieldMappingId, mapping }: SelectorProps) {
  const { headers } = useLoaderData<typeof loader>()
  const { onUpdateMappingInField } = useCreateCampaignContext()

  if (mapping.type !== "merge") return null

  const handleColumnChange = (index: number, column: string) => {
    const newColumns = [...mapping.columns]
    newColumns[index] = column
    onUpdateMappingInField(fieldMappingId, mapping.id, {
      ...mapping,
      columns: newColumns,
    })
  }

  const handleAddColumn = () => {
    if (mapping.columns.length < 4) {
      onUpdateMappingInField(fieldMappingId, mapping.id, {
        ...mapping,
        columns: [...mapping.columns, null],
      })
    }
  }

  const canAddColumn = mapping.columns.length < 4

  return (
    <>
      {mapping.columns.map((col, i) => (
        <Select.Root
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          key={i}
          value={col || ""}
          onValueChange={(value) => handleColumnChange(i, value)}
        >
          <Select.Trigger size="sm">
            <Select.Value placeholder="Selecione..." />
          </Select.Trigger>
          <Select.Content size="sm">
            {headers.map((h) => (
              <Select.Item key={h} value={h}>
                {h}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      ))}

      {canAddColumn && (
        <Button onClick={handleAddColumn} icon size="sm" variant="background">
          <PlusIcon className="size-5 text-zinc-600" />
        </Button>
      )}
    </>
  )
}

function SplitPhoneSelector({ fieldMappingId, mapping }: SelectorProps) {
  const { headers } = useLoaderData<typeof loader>()
  const { onUpdateMappingInField } = useCreateCampaignContext()

  if (mapping.type !== "split") return null

  const handleColumnChange = (column: string) => {
    onUpdateMappingInField(fieldMappingId, mapping.id, { ...mapping, column })
  }

  const handleSeparatorsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateMappingInField(fieldMappingId, mapping.id, {
      ...mapping,
      separators: e.target.value,
    })
  }

  return (
    <>
      <Select.Root
        value={mapping.column || ""}
        onValueChange={handleColumnChange}
      >
        <Select.Trigger size="sm">
          <Select.Value placeholder="Selecione..." />
        </Select.Trigger>
        <Select.Content size="sm">
          {headers.map((h) => (
            <Select.Item key={h} value={h}>
              {h}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>

      <Tooltip.Root delayDuration={1000}>
        <Tooltip.Trigger>
          <Input
            className="w-min px-2 py-1 font-mono text-sm"
            placeholder="Dividir..."
            value={mapping.separators}
            onChange={handleSeparatorsChange}
          />
        </Tooltip.Trigger>

        <Tooltip.Content className="space-y-1 text-start text-sm">
          <p>
            Escolha quais caracteres usar para dividir os números de telefone.
          </p>
          <p>
            Exemplo: utilize{" "}
            <code className="rounded-xs bg-zinc-50 text-primary-800">;</code>{" "}
            caso os números estejam separados por ponto e vírgula
          </p>
          <p>
            Também é possível usar múltiplos caracteres. Exemplo:{" "}
            <code className="rounded-xs bg-zinc-50 text-primary-800">;,|</code>
          </p>
        </Tooltip.Content>
      </Tooltip.Root>
    </>
  )
}
