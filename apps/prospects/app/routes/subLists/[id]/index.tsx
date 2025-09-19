import type { Route } from "./+types"
import { useState } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { Form, Link, useLoaderData } from "react-router"
import { Button, Checkbox, Dialog, Select } from "iboti-ui"

import { getUserOrRedirect } from "~/utils/authGuard"
import { cn } from "~/utils/styling"

import SubListService, {
  subListStatesSchema,
  type DbSubList,
  type SubListState,
} from "~/services/SubListService"
import type { CompleteDomainLead } from "~/services/LeadService"

import { SubListStatusPill } from "~/components/SubListStatusPill"

import { LeadsTable } from "./components/LeadsTable"
import { ProgressIndicator } from "./ProgressIndicator"
import { useMessageTemplates } from "~/hooks/useMessageTemplates"
import type { DomainMessageTemplate } from "~/services/meta/WhatsappTemplateService"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request, "/login")

  const subList = await SubListService.getWithLeads(params.id)

  if (!subList) {
    throw new Response("SubList not found", { status: 404 })
  }

  if (user.role !== "ADMIN" && subList.assigneeId !== user.id) {
    throw new Response("Forbidden", { status: 403 })
  }

  const headersSet = new Set<string>()

  subList.leads
    .flatMap((l) => Object.keys(l.extraInfo || {}))
    .map((h) => headersSet.add(h))

  const headers = [...headersSet]

  // TODO: move this to a mapper or the service itself
  const leads: CompleteDomainLead[] = subList.leads.map((l) => ({
    ...l,
    extra: (l.extraInfo || {}) as Record<string, string>,
    interactions: l.interactions.map((i) => ({
      ...i,
      notes: i.notes || undefined,
    })),
  }))

  const canEdit = subList.assigneeId === user.id

  return {
    user,
    canEdit,
    headers,
    subList: { ...subList, leads },
  }
}

export const action = async ({ request, params }: Route.ActionArgs) => {
  const user = await getUserOrRedirect(request)

  const subList = await SubListService.getWithLeads(params.id)

  if (!subList) {
    throw new Response("SubList not found", { status: 404 })
  }

  if (user.role !== "ADMIN" && subList.assigneeId !== user.id) {
    throw new Response("Forbidden", { status: 403 })
  }

  if (request.method === "PATCH") {
    const formData = await request.formData()
    const assigneeId = formData.get("assigneeId")?.toString()
    const subListStatus = subListStatesSchema.safeParse(formData.get("status"))

    try {
      let subList: DbSubList

      if (assigneeId && user.role === "ADMIN") {
        subList = await SubListService.assign(params.id, assigneeId)
      } else if (subListStatus.success) {
        subList = await SubListService.updateStatus(
          params.id,
          subListStatus.data,
        )
      } else {
        return {
          error: true,
          message: "invalid data",
        }
      }

      return { subList }
    } catch (error) {
      console.error("Failed to update sublist:", error)
      return {
        error: true,
        message: "Failed to update sublist",
      }
    }
  }

  if (request.method === "DELETE") {
    try {
      await SubListService.delete(params.id)
      return { success: true }
    } catch (error) {
      console.error("Failed to delete sublist:", error)
      return {
        error: true,
        message: "Failed to delete sublist",
      }
    }
  }
}

export default function SubListRoute({ loaderData }: Route.ComponentProps) {
  const { user, subList, headers } = loaderData

  const [showContacted, setShowContacted] = useState(true)

  const canStart = subList.state === "new"
  const canFinnish =
    subList.state === "in_progress" &&
    subList.leads.every((l) => l.interactions.length > 0)
  const canReopen = subList.state === "completed"

  return (
    <div className="grid h-screen grid-rows-[auto_1fr] gap-4 p-4">
      <header className="flex items-center justify-between gap-4 border-zinc-400 border-b border-dotted pb-2">
        <div className="flex items-start gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link to="..">
              <ArrowLeftIcon />
            </Link>
          </Button>
          <div className="mt-1">
            <span className="inline-flex items-center gap-2">
              <h1 className="font-semibold text-2xl text-primary-800">
                Listinha
              </h1>

              <SubListStatusPill status={subList.state} />
            </span>
            <div className="columns-3 text-sm">
              {subList.assignee && (
                <p>
                  Atribuído a:{" "}
                  <strong className="text-primary-600">
                    {subList.assignee.name}
                  </strong>
                </p>
              )}
              <p>
                Leads:{" "}
                <strong className="text-primary-600">
                  {subList.leadsCount}
                </strong>
              </p>
              <p>
                Leads contatados:{" "}
                <strong className="text-primary-600">
                  {subList.contactedLeadsCount}
                </strong>
              </p>
            </div>
          </div>
        </div>

        <div>
          {!canStart && !canReopen && !canFinnish && (
            <SubListTools
              setShowContacted={setShowContacted}
              showContacted={showContacted}
            />
          )}

          {canStart && (
            <Form method="patch" className="inline-flex items-center">
              <Button
                name="status"
                value={"in_progress" satisfies SubListState}
                type="submit"
                variant="secondary"
              >
                Inciar
              </Button>
            </Form>
          )}

          {canReopen && (
            <Form method="patch" className="inline-flex items-center">
              <Button
                name="status"
                value={"in_progress" satisfies SubListState}
                type="submit"
                variant="ghost"
              >
                Reabrir
              </Button>
            </Form>
          )}

          {canFinnish && (
            <Form method="patch" className="inline-flex items-center">
              <Button
                name="status"
                value={"completed" satisfies SubListState}
                type="submit"
                variant="secondary"
              >
                Finalizar
              </Button>
            </Form>
          )}
        </div>
      </header>

      <LeadsTable
        isActive={subList.state === "in_progress"}
        leads={subList.leads}
        headers={headers}
      />
    </div>
  )
}

type SubListToolsProps = {
  showContacted: boolean
  setShowContacted: (show: boolean) => void
}

function SubListTools({ setShowContacted, showContacted }: SubListToolsProps) {
  return (
    <fieldset className="top-2 z-20 my-2 flex gap-2 rounded-md border border-zinc-300 bg-zinc-50/50 p-1 text-sm shadow-sm backdrop-blur-2xl">
      <label
        className={cn(
          "flex w-fit select-none items-center gap-2 rounded-sm px-2 py-0.5 transition-colors hover:bg-primary-300/25 ",
          showContacted && "bg-primary-200/60",
        )}
      >
        Mostrar leads contatados{" "}
        <Checkbox
          checked={showContacted}
          onCheckedChange={(s) =>
            setShowContacted(s === "indeterminate" ? true : s)
          }
        />
      </label>

      <CreateMessagingCampaignDialog />
    </fieldset>
  )
}

// biome-ignore lint/complexity/noBannedTypes: <explanation>
type CreateMessagingCampaignDialogProps = {}

const steps = [
  { id: 1, name: "Selecionar template", component: TemplateSelect },
  { id: 2, name: "Mapear campos", component: FieldMapping },
  { id: 3, name: "Confirmar", component: null },
] as const

// biome-ignore lint/correctness/noEmptyPattern: <explanation>
function CreateMessagingCampaignDialog({}: CreateMessagingCampaignDialogProps) {
  const [open, setOpen] = useState(false)

  const [stepId, setStepId] = useState(1)
  const step = steps.find((s) => s.id === stepId)

  const [selectedTemplate, setSelectedTemplate] = useState<
    DomainMessageTemplate | undefined
  >(undefined)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="default" size="sm">
          Envio de mensagens
        </Button>
      </Dialog.Trigger>

      <Dialog.Content className="[--dialog-content-max-width:48rem]">
        <Dialog.Header>
          <Dialog.Title>Novo disparo de mensagens</Dialog.Title>
        </Dialog.Header>

        <ProgressIndicator
          steps={steps}
          currentStepId={stepId}
          className="mb-6"
        />

        <div>
          {step?.component ? (
            <step.component
              open={open}
              onSelectTemplate={setSelectedTemplate}
              selectedTemplate={selectedTemplate}
            />
          ) : (
            <p>Conteúdo do passo "{step?.name}"</p>
          )}
        </div>

        <Dialog.Footer>
          <Dialog.Close asChild>
            <Button variant="ghost">Fechar</Button>
          </Dialog.Close>
          {stepId > 1 && (
            <Button
              onClick={() => {
                if (stepId > 1) setStepId((p) => p - 1)
              }}
              variant="outline"
            >
              Anterior
            </Button>
          )}
          <Button
            onClick={() => {
              if (stepId < steps.length) setStepId((p) => p + 1)
            }}
            variant="default"
          >
            Próximo
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  )
}

type TemplateSelectProps = {
  open: boolean
  onSelectTemplate: (template: DomainMessageTemplate) => void
}

function TemplateSelect({ open, onSelectTemplate }: TemplateSelectProps) {
  const { templates, isLoading } = useMessageTemplates(open)

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  )

  const handleSelectTemplate = (templateId: string) => {
    const template = templates?.find((t) => t.id === templateId)
    if (template) {
      onSelectTemplate(template)
      setSelectedTemplateId(templateId)
    }
  }

  return (
    <>
      <p className="mb-2">
        Selecione o template {templates && `(${templates.length} disponíveis):`}
      </p>
      {isLoading && <p>Carregando templates...</p>}
      {!isLoading && templates && (
        <ul className="max-h-[24rem] space-y-2 overflow-y-auto">
          {templates.map((t) => (
            // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
            <li
              key={t.id}
              data-selected={t.id === selectedTemplateId}
              onClick={() => handleSelectTemplate(t.id)}
              className="group border-primary-500 border-l-[3px] px-2 transition-colors hover:bg-zinc-100/50 data-[selected=true]:border-primary-400 data-[selected=true]:bg-zinc-50"
            >
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 font-medium text-primary-800 transition-colors group-data-[selected=true]:text-primary-600">
                  <Checkbox checked={t.id === selectedTemplateId} />
                  {t.name}
                </label>

                <span className="rounded-full bg-primary-200 px-2 py-0.5 text-primary-800 text-xs">
                  {t.category}
                </span>
              </div>

              {t.parameterNames.length > 0 && (
                <div className="my-1 flex gap-1">
                  {t.parameterNames.map((p) => (
                    <span
                      className="rounded-sm bg-accent-300 px-2 py-0.5 font-medium text-accent-900 text-sm"
                      key={p}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}
              <p className="whitespace-pre-wrap text-sm text-zinc-700">
                {t.content}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

type FieldMappingProps = {
  selectedTemplate?: DomainMessageTemplate
}

function FieldMapping({ selectedTemplate }: FieldMappingProps) {
  const { headers } = useLoaderData<typeof loader>()

  return (
    <>
      <p>Selecione os campos a serem utilizados:</p>

      <div>
        <p>Campos disponíveis:</p>
        <div className="mb-4 flex gap-2">
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

      <div>
        <p>Campos padrão:</p>
        <span className="flex items-center gap-2">
          <strong>Telefone: </strong>
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
        </span>

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