import { useState } from "react"
import { useLoaderData } from "react-router"
import { EllipsisVerticalIcon, PlusIcon } from "lucide-react"
import {
  Button,
  Checkbox,
  Dialog,
  DropdownMenu,
  Input,
  Select,
  Tooltip,
} from "iboti-ui"

import type { DomainMessageTemplate } from "~/services/meta/WhatsappTemplateService"

import { useMessageTemplates } from "~/hooks/useMessageTemplates"

import type { loader } from ".."
import { ProgressIndicator } from "../ProgressIndicator"
import { CreateCampaignProvider, useCreateCampaignContext } from "./context"

export function CreateMessagingCampaignDialog() {
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
    goToNextStep,
    goToPreviousStep,
  } = useCreateCampaignContext()

  const step = getFullStep()

  return (
    <Dialog.Content className="[--dialog-content-max-width:48rem]">
      <Dialog.Header>
        <Dialog.Title>Novo disparo de mensagens</Dialog.Title>

        {/* <ProgressIndicator
            steps={steps}
            currentStepId={stepId}
            className="mb-6"
          /> */}
      </Dialog.Header>

      <div>
        {step?.component ? (
          <step.component />
        ) : (
          <p>Conteúdo do passo "{step?.name}"</p>
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
        <Button
          onClick={goToNextStep}
          variant="default"
          disabled={!canStepNext}
        >
          Próximo
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  )
}
