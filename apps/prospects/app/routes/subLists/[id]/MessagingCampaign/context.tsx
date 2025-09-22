import { createContext, useContext, useEffect, useState } from "react"
import { TemplateSelect } from "./TemplateSelect"
import type { DomainMessageTemplate } from "~/services/meta/WhatsappTemplateService"
import { FieldMapping } from "./FieldMapping"

const steps = [
  { id: 1, name: "Selecionar template", component: TemplateSelect },
  { id: 2, name: "Mapear campos", component: FieldMapping },
  { id: 3, name: "Confirmar", component: null },
] as const

type CreateCampaignContext = {
  dialogOpen: boolean
  setDialogOpen: (open: boolean) => void
  currentStepId: number
  canStepBack: boolean
  canStepNext: boolean
  isLastStep: boolean
  getFullStep: () => (typeof steps)[number]
  goToNextStep: () => void
  goToPreviousStep: () => void
  selectedTemplate?: DomainMessageTemplate
}

const createCampaignContext = createContext<CreateCampaignContext | null>(null)

type CreateCampaignProviderProps = {
  children: React.ReactNode
}

export function CreateCampaignProvider({
  children,
}: CreateCampaignProviderProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentStepId, setCurrentStepId] = useState(1)

  const goToNextStep = () => {
    setCurrentStepId((prev) => prev + 1)
  }

  const goToPreviousStep = () => {
    console.log("going back")
    setCurrentStepId((prev) => {
      console.log({ prev })
      return prev - 1
    })
  }
  const selectedTemplate = undefined
  // Handle step validation logic in the context
  useEffect(() => {
    // If we're on step 2 (FieldMapping) but no template is selected,
    // automatically go back to step 1
    if (currentStepId === 2 && !selectedTemplate) {
      console.log("No template selected, going back to step 1")
      setCurrentStepId(1)
    }
  }, [currentStepId, selectedTemplate])

  const getFullStep = () => {
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    return steps.find((step) => step.id === currentStepId)!
  }

  const canStepBack = currentStepId > 1
  const canStepNext = currentStepId < 3
  const isLastStep = currentStepId === 3

  console.log({
    currentStepId,
  })

  return (
    <createCampaignContext.Provider
      value={{
        dialogOpen,
        setDialogOpen,
        currentStepId,
        goToNextStep,
        goToPreviousStep,
        canStepBack,
        canStepNext,
        isLastStep,
        getFullStep,
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
