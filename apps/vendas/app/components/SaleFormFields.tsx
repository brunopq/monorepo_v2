import { useFetcher } from "react-router"
import { useEffect } from "react"
import { format, parse } from "date-fns"
import { utc } from "@date-fns/utc"
import { z } from "zod"

import { captationTypeSchema } from "~/db/schema"

import type { DomainCampaign } from "~/services/CampaignService"
import type { DomainOrigin } from "~/services/OriginService"
import type { DomainSale } from "~/services/SalesService"

import type { loader as campaignLoader } from "~/routes/app.campaigns"
import type { loader as originLoader } from "~/routes/app.origins"

import { Input, Select, Checkbox, RadioGroup, BrlInput, Textarea } from "./ui"
import FormGroup from "./FormGroup"
import { brl } from "~/lib/formatters"

export const saleFormSchema = z.object({
  date: z
    .string({ required_error: "Insira uma data" })
    .date("Data mal formatada"),
  seller: z.string({ message: "Seller is required" }),
  campaign: z.string({ required_error: "Selecione a campanha da venda" }),
  origin: z.string({ required_error: "Selecione uma origem para a venda" }),
  captationType: captationTypeSchema({
    required_error: "Escolha um tipo de captação",
    invalid_type_error: "Tipo de captação inválido",
  }),
  client: z
    .string({ required_error: "Insira o nome do cliente" })
    .min(1, "Insira o nome do cliente"),
  adverseParty: z
    .string({ required_error: "Insira a parte adversa" })
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
        <Input
          placeholder="Nome"
          name="indication"
          defaultValue={defaults?.indication ?? undefined}
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
