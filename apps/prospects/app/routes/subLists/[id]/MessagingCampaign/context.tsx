import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useLoaderData } from "react-router"

import { phoneInternational } from "~/utils/formatting"

import type { NewDomainOficialWhatsappMessage } from "~/services/MessagingCampaignService"
import type { DomainMessageTemplate } from "~/services/meta/WhatsappTemplateService"

import { useCreateMessagingCampaign } from "~/hooks/useCreateMessagingCampaign"

import { TemplateSelect } from "./TemplateSelect"
import { FieldMappingStep } from "./FieldMappingStep"
import { ConfirmationStep } from "./ConfirmationStep"
import type { FieldMapping, Mapping } from "./types"
import type { loader } from ".."
import { extractorFn } from "./utils"

const steps = [
  { id: 1, name: "Selecionar template", component: TemplateSelect },
  { id: 2, name: "Mapear campos", component: FieldMappingStep },
  { id: 3, name: "Confirmar", component: ConfirmationStep },
] as const

type CreateCampaignContext = {
  currentStepId: number
  canStepBack: boolean
  canStepNext: boolean
  isLastStep: boolean
  getFullStep: () => (typeof steps)[number]
  goToNextStep: () => void
  goToPreviousStep: () => void
  selectedTemplate?: DomainMessageTemplate
  onSelectTemplate: (template: DomainMessageTemplate) => void
  mappings: FieldMapping[]
  onAddMapping: (mapping: FieldMapping) => void
  onUpdateMapping: (mappingId: string, updated: Partial<FieldMapping>) => void
  onRemoveMapping: (mappingId: string) => void
  onAddMappingToField: (fieldMappingId: string, mapping: Mapping) => void
  onUpdateMappingInField: (
    fieldMappingId: string,
    mappingId: string,
    updated: Mapping,
  ) => void
  onRemoveMappingFromField: (fieldMappingId: string, mappingId: string) => void
  onCreate: () => void
  leadsCount: number
  messagesCount: number
}

const createCampaignContext = createContext<CreateCampaignContext | null>(null)

type CreateCampaignProviderProps = {
  children: React.ReactNode
}

export function CreateCampaignProvider({ children }: CreateCampaignProviderProps) {
  const { subList } = useLoaderData<typeof loader>()
  const [currentStepId, setCurrentStepId] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState<
    DomainMessageTemplate | undefined
  >(undefined)
  const [mappings, setMappings] = useState<FieldMapping[]>([])

  const { create, creating, error } = useCreateMessagingCampaign()

  const goToNextStep = () => {
    setCurrentStepId((prev) => prev + 1)
  }

  const goToPreviousStep = () => {
    setCurrentStepId((prev) => prev - 1)
  }

  const getFullStep = () => {
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    return steps.find((step) => step.id === currentStepId)!
  }

  const canStepBack = currentStepId > 1
  const canStepNext =
    (currentStepId === 1 && !!selectedTemplate) || currentStepId === 2
  const isLastStep = currentStepId === 3

  const onAddMapping = (mapping: FieldMapping) => {
    setMappings((prev) => {
      if (prev.find((m) => m.name === mapping.name)) {
        return prev
      }
      return [...prev, mapping]
    })
  }

  const onUpdateMapping = (
    mappingId: string,
    updated: Partial<FieldMapping>,
  ) => {
    setMappings((prev) =>
      prev.map((m) => (m.id === mappingId ? { ...m, ...updated } : m)),
    )
  }

  const onRemoveMapping = (mappingId: string) => {
    setMappings((prev) => prev.filter((m) => m.id !== mappingId))
  }

  const onAddMappingToField = (fieldMappingId: string, mapping: Mapping) => {
    setMappings((prev) =>
      prev.map((fieldMapping) =>
        fieldMapping.id === fieldMappingId
          ? { ...fieldMapping, mappings: [...fieldMapping.mappings, mapping] }
          : fieldMapping,
      ),
    )
  }

  const onUpdateMappingInField = (
    fieldMappingId: string,
    mappingId: string,
    updated: Mapping,
  ) => {
    setMappings((prev) =>
      prev.map((fieldMapping) =>
        fieldMapping.id === fieldMappingId
          ? {
              ...fieldMapping,
              mappings: fieldMapping.mappings.map((mapping) =>
                mapping.id === mappingId ? { ...updated } : mapping,
              ),
            }
          : fieldMapping,
      ),
    )
  }

  const onRemoveMappingFromField = (
    fieldMappingId: string,
    mappingId: string,
  ) => {
    setMappings((prev) =>
      prev.map((fieldMapping) =>
        fieldMapping.id === fieldMappingId
          ? {
              ...fieldMapping,
              mappings: fieldMapping.mappings.filter(
                (mapping) => mapping.id !== mappingId,
              ),
            }
          : fieldMapping,
      ),
    )
  }

  const makeMessages = () => {
    if (!selectedTemplate) {
      return
    }
    if (!mappings.length) {
      return
    }

    const phoneMappings = mappings.find((m) => m.name === "Telefone")
    const fieldMappings = mappings
      .filter((m) => m.name !== "Telefone" && m.mappings.length > 0)
      .map((m) => ({ ...m.mappings[0], name: m.name }))

    if (!phoneMappings) {
      return
    }

    // TODO: decide if this type is ok here, it comes from the service
    const messages: NewDomainOficialWhatsappMessage[] = subList.leads.flatMap(
      (lead) => {
        const phones: string[] = extractorFn(phoneMappings)(lead.extra)
          .map((phoneNumber) => String(phoneNumber).replace(/\D/g, ""))
          .map(phoneInternational)
          // TODO: do something with the errors
          .filter((r) => r.success)
          .map((r) => r.phone)

        return phones.map((phone) => {
          const params = fieldMappings.reduce<Record<string, string>>(
            (acc, fm) => {
              if (fm.type === "simple" && fm.column) {
                acc[fm.name] = lead.extra[fm.column] || ""
              }
              return acc
            },
            {},
          )

          return {
            leadId: lead.id,
            phoneNumber: phone,
            messageTemplateName: selectedTemplate.name,
            templateParameters: params,
            renderedText: selectedTemplate.content.replace(
              /\{\{\s*\$json\.(\w+)\s*\}\}/g,
              (match, key) => (params[key] !== undefined ? params[key] : match),
            ),
          } satisfies NewDomainOficialWhatsappMessage
        })
      },
    )
    return messages
  }

  const onCreate = () => {
    const messages = makeMessages()

    if (!messages) {
      return
    }

    create({
      messagingCampaign: {
        name: `Campanha - ${new Date().toLocaleDateString()}`,
        subListId: subList.id,
        type: "oficial_whatsapp_api",
      },
      messages,
    })
  }

  const leadsCount = useMemo(() => subList.leads.length, [subList.leads.length])
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const messagesCount = useMemo(
    () => makeMessages()?.length || 0,
    [mappings, selectedTemplate, subList.leads.length],
  )

  // Handle step validation logic in the context
  useEffect(() => {
    // If we're on step 2 (FieldMapping) but no template is selected,
    // automatically go back to step 1
    if (currentStepId === 2 && !selectedTemplate) {
      console.log("No template selected, going back to step 1")
      setCurrentStepId(1)
    }
  }, [currentStepId, selectedTemplate])


  return (
    <createCampaignContext.Provider
      value={{
        currentStepId,
        goToNextStep,
        goToPreviousStep,
        canStepBack,
        canStepNext,
        isLastStep,
        getFullStep,
        selectedTemplate,
        onSelectTemplate: setSelectedTemplate,
        mappings,
        onAddMapping,
        onUpdateMapping,
        onRemoveMapping,
        onAddMappingToField,
        onUpdateMappingInField,
        onRemoveMappingFromField,

        onCreate,

        leadsCount,
        messagesCount,
      }}
    >
      {children}
    </createCampaignContext.Provider>
  )
}

export function useCreateCampaignContext() {
  const context = useContext(createCampaignContext)

  if (!context) {
    throw new Error(
      "useCreateCampaignContext must be used within a CreateCampaignProvider",
    )
  }

  return context
}
