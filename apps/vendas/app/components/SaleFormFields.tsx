import { useMemo } from "react"
import { format, parse } from "date-fns"
import { utc } from "@date-fns/utc"
import { z } from "zod"

import { Input, Select, Checkbox, RadioGroup, Textarea } from "iboti-ui"
import { AutocompleteInput } from "./AutocompleteInput"
import { BrlInput } from "./ui"

import { brl } from "~/lib/formatters"

import { captationTypeSchema } from "~/db/schema"

import type { DomainCampaign } from "~/services/CampaignService"
import type { DomainSale } from "~/services/SalesService"

import { useReferrers } from "~/hooks/data/useReferrers"
import { useCampaigns } from "~/hooks/data/useCampaigns"
import { useOrigins } from "~/hooks/data/useOrigins"

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
  const { referrers, loading: referrersLoading } = useReferrers()
  const { origins, loading: originsLoading } = useOrigins(false)

  let date = useMemo(() => {
    return defaults?.date
      ? parse(defaults.date, "yyyy-MM-dd", new Date(), { in: utc })
      : new Date()
  }, [defaults?.date])

  const {
    data,
    loading: campaignsLoading,
    refetch: refetchCampaigns,
  } = useCampaigns(date)

  let cc: DomainCampaign[] = []

  if (data) {
    cc = data.campaigns
    date = new Date(data.date)
  }

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
            disabled={campaignsLoading}
            onValueChange={removeErrors}
            name="campaign"
          >
            <Select.Trigger>
              <Select.Value placeholder="Selecione..." />
            </Select.Trigger>
            <Select.Content>
              {cc.map((c) => (
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
            disabled={originsLoading}
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
            disabled={campaignsLoading}
            value={format(date, "yyyy-MM-dd", { in: utc })}
            onChange={(e) => {
              removeErrors()
              const newDate = e.target.valueAsDate

              if (!newDate) return
              refetchCampaigns(newDate)
            }}
            name="date"
            id="date"
            type="date"
          />
        )}
      </FormGroup>

      <FormGroup name="indication" label="Indicado por:">
        <AutocompleteInput
          placeholder="Nome"
          name="indication"
          disabled={referrersLoading}
          defaultValue={defaults?.indication ?? undefined}
          options={referrers?.map((r) => r.referrerName) || []}
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
