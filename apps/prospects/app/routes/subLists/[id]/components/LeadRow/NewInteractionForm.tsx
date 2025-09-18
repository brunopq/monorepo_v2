import { Button, Input, Select } from "iboti-ui"
import {
  MailIcon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  PhoneIcon,
} from "lucide-react"
import { Form } from "react-router"

import {
  interactionStatuses,
  interactionStatusesLabels,
  interactionTypes,
  interactionTypesLabels,
} from "~/constants/interactions"

type NewInteractionFormProps = {
  leadId: number
  onClose: () => void
}

const getInteractionTypeIcon = (type: string) => {
  switch (type) {
    case "whatsapp_message":
      return <MessageCircleIcon className="size-4 text-green-700" />
    case "whatsapp_call":
      return <PhoneIcon className="size-4 text-green-700" />
    case "call":
      return <PhoneIcon className="size-4" />
    case "email":
      return <MailIcon className="size-4" />
    case "other":
      return <MoreHorizontalIcon className="size-4" />
    default:
      return null
  }
}

const reminderOptions = [
  { value: "disabled", label: "Desativado", default: true },
  { value: "1_day", label: "Em 1 dia" },
  { value: "2_days", label: "Em 2 dias" },
  { value: "1_week", label: "Em 1 semana" },
]

export function NewInteractionForm({
  leadId,
  onClose,
}: NewInteractionFormProps) {
  return (
    <Form
      navigate={false}
      method="post"
      action={`/leads/${leadId}/interactions`}
      onSubmit={onClose}
      className="@container inset-shadow-accent-600/20 inset-shadow-xs mb-2 rounded-md bg-zinc-200 p-2 shadow-accent-600/20 shadow-xs"
    >
      <div className="grid @5xl:grid-cols-[1fr_1fr_auto] grid-cols-1 @5xl:grid-rows-2 grid-rows-4 gap-1">
        <Select.Root name="interactionType">
          <Select.Trigger className="row-start-1 text-sm">
            <Select.Value placeholder="Selecione o canal da interação" />
          </Select.Trigger>
          <Select.Content>
            {interactionTypes.map((type) => (
              <Select.Item key={type} value={type}>
                <div className="flex items-center gap-2">
                  {getInteractionTypeIcon(type)}
                  {interactionTypesLabels[type]}
                </div>
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        <Select.Root name="interactionStatus">
          <Select.Trigger className="row-start-2 text-sm">
            <Select.Value placeholder="Selecione o status" />
          </Select.Trigger>
          <Select.Content>
            {interactionStatuses.map((status) => (
              <Select.Item key={status} value={status}>
                {interactionStatusesLabels[status]}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        <Input
          name="notes"
          placeholder="Notas (opcional)"
          className="@5xl:row-start-1 row-start-3 text-sm"
        />

        <div className="@5xl:row-start-2 row-start-4 flex items-center gap-3 rounded-md border border-zinc-300 bg-zinc-100 px-3 py-2 shadow">
          <label className="font-medium text-sm text-zinc-700">Lembrete</label>
          <fieldset className="flex gap-1">
            {reminderOptions.map((option) => (
              <label
                key={option.value}
                className="cursor-pointer select-none text-nowrap rounded-md px-2 py-0.5 text-xs transition-colors hover:bg-zinc-300 has-checked:bg-accent-300/75 has-checked:text-accent-950"
              >
                <input
                  name="reminder"
                  className="hidden"
                  type="radio"
                  defaultChecked={option.default}
                  value={option.value}
                />
                {option.label}
              </label>
            ))}
          </fieldset>
        </div>

        <Button
          className="row-span-full row-start-1 ml-2 self-center"
          type="submit"
        >
          Registrar interação
        </Button>
      </div>
    </Form>
  )
}
