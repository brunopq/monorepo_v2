import { Button, Dialog } from "iboti-ui"
import { useLoaderData } from "react-router"

import { CreateCampaignProvider, useCreateCampaignContext } from "./context"
import type { loader } from ".."

export function CreateMessagingCampaignDialog() {
  const { user } = useLoaderData<typeof loader>()

  if (!user || user.role !== "ADMIN") {
    return null
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="default" size="sm">
          Envio de mensagens
        </Button>
      </Dialog.Trigger>

      <CreateCampaignProvider>
        <CreateMessagingCampaignDialogContent />
      </CreateCampaignProvider>
    </Dialog.Root>
  )
}

function CreateMessagingCampaignDialogContent() {
  const {
    getFullStep,
    canStepBack,
    canStepNext,
    isLastStep,
    onCreate,
    goToNextStep,
    goToPreviousStep,
  } = useCreateCampaignContext()

  const step = getFullStep()

  return (
    <Dialog.Content className="[--dialog-content-max-width:48rem]">
      <Dialog.Header>
        <Dialog.Title>Novo disparo de mensagens</Dialog.Title>
      </Dialog.Header>

      <div>
        {step?.component ? (
          <step.component />
        ) : (
          <p>Nenhum passo selecionado (???)</p>
        )}
      </div>

      <Dialog.Footer>
        <Dialog.Close asChild>
          <Button variant="ghost">Fechar</Button>
        </Dialog.Close>
        {canStepBack && (
          <Button onClick={goToPreviousStep} variant="outline">
            Anterior
          </Button>
        )}
        {isLastStep ? (
          <Button onClick={onCreate} variant="default">
            Criar
          </Button>
        ) : (
          <Button
            onClick={goToNextStep}
            variant="default"
            disabled={!canStepNext}
          >
            Próximo
          </Button>
        )}
      </Dialog.Footer>
    </Dialog.Content>
  )
}
