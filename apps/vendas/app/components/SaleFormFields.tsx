import { useFetcher } from "react-router"
import { useEffect, useRef, useState } from "react"
import { format, parse } from "date-fns"
import { utc } from "@date-fns/utc"
import { z } from "zod"

import {
  Input,
  Select,
  Checkbox,
  RadioGroup,
  Textarea,
  type InputProps,
  Popover,
  Button,
} from "iboti-ui"
import { BrlInput } from "./ui"

import { brl } from "~/lib/formatters"

import { captationTypeSchema } from "~/db/schema"

import type { DomainCampaign } from "~/services/CampaignService"
import type { DomainOrigin } from "~/services/OriginService"
import type { DomainSale } from "~/services/SalesService"

import type { loader as campaignLoader } from "~/routes/app.campaigns"
import type { loader as originLoader } from "~/routes/app.origins"

import FormGroup from "./FormGroup"

export const saleFormSchema = z.object({
  date: z.string("Insira uma data").date("Data mal formatada"),
  seller: z.string({ message: "Seller is required" }),
  campaign: z.string("Selecione a campanha da venda"),
  origin: z.string("Selecione uma origem para a venda"),
  captationType: captationTypeSchema({
    error: "Escolha um tipo de captação válido",
  }),
  client: z
    .string("Insira o nome do cliente")
    .min(1, "Insira o nome do cliente"),
  adverseParty: z
    .string("Insira a parte adversa")
    .min(1, "Insira a parte adversa"),
  isRepurchase: z.coerce.boolean().default(false),
  estimatedValue: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Valor estimado deve estar no formato correto")
    .optional(),
  comments: z.string().optional(),
  indication: z.string().optional(),
})

export type SaleFormFieldsProps = {
  defaults?: Partial<DomainSale>
}

export default function SaleFormFields({ defaults }: SaleFormFieldsProps) {
  const campaignsFetcher = useFetcher<typeof campaignLoader>()
  const originsFetcher = useFetcher<typeof originLoader>()

  const campaignData = campaignsFetcher.data
  const originData = originsFetcher.data

  let campaigns: DomainCampaign[] = []
  let origins: DomainOrigin[] = []
  let date = defaults?.date
    ? parse(defaults.date, "yyyy-MM-dd", new Date(), { in: utc })
    : new Date()

  if (campaignData) {
    campaigns = campaignData.campaigns
    date = new Date(campaignData.date)
  }
  if (originData) {
    origins = originData.origins
  }

  useEffect(() => {
    const date = defaults?.date ?? new Date()
    campaignsFetcher.load(
      `/app/campaigns?date=${format(date, "yyyy-MM-dd", { in: utc })}`,
    )
    originsFetcher.load("/app/origins?includeInactive=false")
  }, [originsFetcher.load, campaignsFetcher.load, defaults?.date])

  return (
    <>
      <FormGroup className="col-span-2" name="client" label="Cliente">
        {(removeErrors) => (
          <Input
            defaultValue={defaults?.client}
            name="client"
            id="client"
            placeholder="Nome do cliente"
            onInput={removeErrors}
          />
        )}
      </FormGroup>

      <FormGroup
        className="col-span-2"
        name="adverseParty"
        label="Parte adversa"
      >
        {(removeErrors) => (
          <Input
            defaultValue={defaults?.adverseParty}
            onInput={removeErrors}
            name="adverseParty"
            id="adverseParty"
            placeholder="Parte adversa"
          />
        )}
      </FormGroup>

      <FormGroup name="campaign" label="Área">
        {(removeErrors) => (
          <Select.Root
            defaultValue={defaults?.campaign}
            disabled={campaignsFetcher.state === "loading"}
            onValueChange={removeErrors}
            name="campaign"
          >
            <Select.Trigger>
              <Select.Value placeholder="Selecione..." />
            </Select.Trigger>
            <Select.Content>
              {campaigns.map((c) => (
                <Select.Item key={c.id} value={c.id}>
                  {c.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        )}
      </FormGroup>

      <FormGroup name="origin" label="Origem">
        {(removeErrors) => (
          <Select.Root
            defaultValue={defaults?.origin ?? undefined}
            disabled={originsFetcher.state === "loading"}
            onValueChange={removeErrors}
            name="origin"
          >
            <Select.Trigger>
              <Select.Value placeholder="Selecione..." />
            </Select.Trigger>
            <Select.Content>
              {origins.map((c) => (
                <Select.Item key={c.id} value={c.id}>
                  {c.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        )}
      </FormGroup>

      <FormGroup
        className="flex flex-col"
        name="captationType"
        label="Tipo de captação"
      >
        {(removeErrors) => (
          <RadioGroup.Root
            onChange={removeErrors}
            defaultValue={defaults?.captationType}
            name="captationType"
            className="flex flex-1 gap-4"
          >
            <label className="flex items-center gap-2">
              <RadioGroup.Item value="ATIVO" />
              Ativa
            </label>
            <label className="flex items-center gap-2">
              <RadioGroup.Item value="PASSIVO" />
              Passiva
            </label>
          </RadioGroup.Root>
        )}
      </FormGroup>

      <FormGroup
        className="flex flex-col"
        name="isRepurchase"
        label="É recompra"
      >
        <label className="flex flex-1 items-center gap-2">
          Sim
          <Checkbox
            defaultChecked={defaults?.isRepurchase}
            name="isRepurchase"
            id="isRepurchase"
            className="block"
          />
        </label>
      </FormGroup>

      <FormGroup
        className="col-span-2"
        name="estimatedValue"
        label="Valor estimado"
      >
        {(removeErrors) => (
          <BrlInput
            defaultValue={
              defaults?.estimatedValue
                ? brl(defaults.estimatedValue)
                : undefined
            }
            onInput={removeErrors}
            name="estimatedValue"
            id="estimatedValue"
            // placeholder="R$ 1.000,00"
          />
        )}
      </FormGroup>

      <FormGroup name="date" label="Data da venda">
        {(removeErrors) => (
          <Input
            disabled={campaignsFetcher.state === "loading"}
            value={format(date, "yyyy-MM-dd", { in: utc })}
            onChange={(e) => {
              removeErrors()
              const newDate = e.target.valueAsDate

              if (!newDate) return
              campaignsFetcher.load(
                `/app/campaigns?date=${format(newDate, "yyyy-MM-dd", { in: utc })}`,
              )
            }}
            name="date"
            id="date"
            type="date"
          />
        )}
      </FormGroup>

      <FormGroup name="indication" label="Indicado por:">
        <SuggestionsInput
          placeholder="Nome"
          name="indication"
          defaultValue={defaults?.indication ?? undefined}
          options={["Fulano", "Ciclano", "Beltrano"]}
        />
      </FormGroup>

      <FormGroup className="col-span-full" name="comments" label="Observações">
        <Textarea
          defaultValue={defaults?.comments ?? undefined}
          id="comments"
          name="comments"
          placeholder="Outras informações relevantes..."
        />
      </FormGroup>
    </>
  )
}

type SuggestionsInputProps = InputProps & {
  options: string[]
}

function SuggestionsInput({ options, ...props }: SuggestionsInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const optionsRef = useRef<HTMLButtonElement[]>([])
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(
    // only allow strings
    props.defaultValue?.toString() || "",
  )

  // Normalize text by removing diacritics, spaces, and converting to lowercase
  const normalizeText = (text: string) => {
    return (
      text
        .normalize("NFD")
        // biome-ignore lint/suspicious/noMisleadingCharacterClass: <explanation>
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/\s+/g, "") // Remove spaces
        .toLowerCase()
    )
  }

  // Filter options based on input
  const filteredOptions = options.filter((option) => {
    if (!inputValue.trim()) return true
    const normalizedOption = normalizeText(option)
    const normalizedInput = normalizeText(inputValue)
    return normalizedOption.includes(normalizedInput)
  })

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestionsOpen) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        // Focus first option
        optionsRef.current[0]?.focus()
        break
      case "Tab":
        e.preventDefault()
        // Focus first option
        optionsRef.current[0]?.focus()
        break
      case "Escape":
        setSuggestionsOpen(false)
        inputRef.current?.focus()
        break
      case "Enter":
        if (filteredOptions.length > 0 && suggestionsOpen) {
          e.preventDefault()
          handleSelect(filteredOptions[0])
        }
        break
    }
  }

  const handleOptionKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    e.preventDefault()
    switch (e.key) {
      case "ArrowDown": {
        const nextIndex = (index + 1) % filteredOptions.length
        optionsRef.current[nextIndex]?.focus()
        break
      }
      case "ArrowUp": {
        const prevIndex = index === 0 ? filteredOptions.length - 1 : index - 1
        optionsRef.current[prevIndex]?.focus()
        break
      }
      case "Tab": {
        inputRef.current?.focus()
        setSuggestionsOpen(true)
        break
      }
      case "Enter":
        handleSelect(filteredOptions[index])
        break
      case "Escape":
        setSuggestionsOpen(false)
        inputRef.current?.focus()
        break
    }
  }

  const handleSelect = (option: string) => {
    // Update the input value directly
    if (inputRef.current) {
      inputRef.current.value = option
      // Trigger change event for form handling
      const event = new Event("input", { bubbles: true })
      inputRef.current.dispatchEvent(event)
    }
    setInputValue(option)
    setSuggestionsOpen(false)
    inputRef.current?.focus()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setSuggestionsOpen(true)
    props.onInput?.(e)
  }

  const handleFocus = () => {
    setSuggestionsOpen(true)
  }

  const handleBlur = (e: React.FocusEvent) => {
    // Check if focus is moving to one of our option buttons
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget?.closest("[data-suggestion-option]")) {
      return // Don't close if focusing on an option
    }
    setSuggestionsOpen(false)
  }

  useEffect(() => {
    if (filteredOptions.length === 0) {
      setSuggestionsOpen(false)
    }
  }, [filteredOptions])

  return (
    <Popover.Root
      modal={false}
      open={suggestionsOpen}
      onOpenChange={setSuggestionsOpen}
    >
      <Popover.Anchor>
        <Input
          ref={inputRef}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onInput={handleInputChange}
          autoComplete="off"
          {...props}
        />
      </Popover.Anchor>

      <Popover.Content
        align="start"
        className="flex max-h-60 flex-col overflow-auto p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {filteredOptions.map((option, index) => (
          <Button
            key={option}
            ref={(el) => {
              if (el) optionsRef.current[index] = el
            }}
            className="justify-start rounded-xs font-normal text-base"
            size="sm"
            variant="ghost"
            data-suggestion-option
            onKeyDown={(e) => handleOptionKeyDown(e, index)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleSelect(option)}
          >
            {option}
          </Button>
        ))}
      </Popover.Content>
    </Popover.Root>
  )
}