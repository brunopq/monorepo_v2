import { useLoaderData } from "react-router"
import { Button, DropdownMenu, Input, Select, Tooltip } from "iboti-ui"
import { useEffect, useState } from "react"
import { EllipsisVerticalIcon, PlusIcon } from "lucide-react"

import { useCreateCampaignContext } from "./context"
import type { loader } from ".."

export function FieldMapping() {
  const { headers } = useLoaderData<typeof loader>()

  const { selectedTemplate, goToPreviousStep } = useCreateCampaignContext()

  if (!selectedTemplate) {
    return "invalid state"
  }

  return (
    <>
      <div className="mb-6">
        <p>Colunas da lista:</p>
        <div className="flex gap-2">
          {headers.map((h) => (
            <span
              key={h}
              className="rounded-sm bg-accent-300 px-2 py-0.5 font-medium text-accent-900 text-sm"
            >
              {h}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <p>Campos padrão:</p>
        <CrazyPhoneSelect />
      </div>

      <div>
        <p>Campos da mensagem:</p>
        {selectedTemplate && selectedTemplate.parameterNames.length > 0 ? (
          selectedTemplate.parameterNames.map((param) => (
            <div key={param} className="mt-2 flex items-center gap-2">
              <strong>{param}: </strong>
              <Select.Root>
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
            </div>
          ))
        ) : (
          <p>Nenhum campo para mapear</p>
        )}
      </div>
    </>
  )
}

type PhoneVariants = "simple" | "merge" | "split"

type BasePhone = {
  variant: PhoneVariants
}

type SimplePhone = BasePhone & {
  variant: "simple"
  column: string | null
}

type MergePhone = BasePhone & {
  variant: "merge"
  columns: (string | null)[]
}

type SplitPhone = BasePhone & {
  variant: "split"
  column: string | null
  separators: string
}

type Phone = SimplePhone | MergePhone | SplitPhone

type ExtractorFactory = (config: Phone) => PhoneExtractorFunction
type PhoneExtractorFunction = (data: Record<string, string>) => string[]

const extractorFactory: ExtractorFactory = (config) => {
  switch (config.variant) {
    case "simple":
      return (data) => {
        const value = data[config.column || ""] || ""
        return value ? [value] : []
      }

    case "merge":
      return (data) => {
        const values = config.columns
          .map((col) => data[col || ""] || "")
          .filter((v) => v)
        return values
      }

    case "split":
      return (data) => {
        const value = data[config.column || ""] || ""
        if (!value) return []
        const separatorsRegex = new RegExp(`[${config.separators}]`, "g")
        return value
          .split(separatorsRegex)
          .map((v) => v.trim())
          .filter((v) => v)
      }
  }
}

// biome-ignore lint/complexity/noBannedTypes: <explanation>
type CrazyPhoneSelectProps = {}

// biome-ignore lint/correctness/noEmptyPattern: <explanation>
function CrazyPhoneSelect({}: CrazyPhoneSelectProps) {
  const { headers } = useLoaderData<typeof loader>()
  const [phones, setPhones] = useState<string[]>([])

  return (
    <span className="flex gap-2">
      <strong>Telefones: </strong>

      <div className="flex-1 space-y-2">
        {phones.map((phone) => (
          <CrazyPhoneInput
            key={phone}
            phone={phone}
            onRemovePhone={() =>
              setPhones((prev) => prev.filter((p) => p !== phone))
            }
          />
        ))}

        <Button
          onClick={() => setPhones((p) => [...p, p.length.toString()])}
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

type CrazyPhoneInputProps = {
  phone: string
  onRemovePhone: () => void
}

function CrazyPhoneInput({ phone, onRemovePhone }: CrazyPhoneInputProps) {
  const { headers } = useLoaderData<typeof loader>()

  const [mode, setMode] = useState("simple") // "merge" | "split" | "simple"

  return (
    <span className="flex items-center gap-1">
      {mode === "simple" && <SimplePhoneSelector />}
      {mode === "merge" && <MergePhoneSelector />}
      {mode === "split" && <SplitPhoneSelector />}

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button icon size="sm" variant="background">
            <EllipsisVerticalIcon className="size-5 text-zinc-600" />
          </Button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content>
          <DropdownMenu.Item variant="danger" onSelect={onRemovePhone}>
            Remover
          </DropdownMenu.Item>

          <DropdownMenu.Separator />

          <DropdownMenu.RadioGroup value={mode} onValueChange={setMode}>
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

function SimplePhoneSelector() {
  const { headers } = useLoaderData<typeof loader>()
  return (
    <Select.Root>
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

function MergePhoneSelector() {
  const { headers } = useLoaderData<typeof loader>()
  const [columns, setColumns] = useState<(string | undefined)[]>([undefined])

  const handleAddColumn = () => {
    if (columns.length < 4) setColumns((p) => [...p, undefined])
  }

  const canAddColumn = columns.length < 4

  return (
    <>
      {columns.map((col, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
        <Select.Root key={i}>
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

function SplitPhoneSelector() {
  const { headers } = useLoaderData<typeof loader>()
  return (
    <>
      <Select.Root>
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
          <Input className="w-min px-2 py-1 text-sm" placeholder="Dividir..." />
        </Tooltip.Trigger>

        <Tooltip.Content className="space-y-1 text-start text-sm">
          <p>
            Escolha quais caracteres usar para dividir os números de telefone.
          </p>
          <p>
            Exemplo: utilize <code>;</code> caso os números estejam separados
            por ponto e vírgula
          </p>
        </Tooltip.Content>
      </Tooltip.Root>
    </>
  )
}
