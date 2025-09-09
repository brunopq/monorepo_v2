import type { Route } from "./+types"
import { z } from "zod/v4"
import { format } from "date-fns"

import { getUserOrRedirect } from "~/utils/authGuard"

import InteractionService, {
  interactionStatusSchema,
  interactionTypeSchema,
  newInteractionSchema,
  type InteractionTypes,
} from "~/services/InteractionService"
import ReminderService, {
  reminderPeriodsSchema,
  type DomainReminder,
} from "~/services/ReminderService"

const createInteractionSchema = z.object({
  interactionType: interactionTypeSchema,
  interactionStatus: interactionStatusSchema,
  notes: z.string().optional(),
  reminder: reminderPeriodsSchema,
})

function generateReminderMessage(
  interactionType: InteractionTypes,
  contactedAt: Date,
): string {
  const formattedDate = format(contactedAt, "dd/MM/yyyy")

  const actionMap: Record<InteractionTypes, string> = {
    call: "realizou uma ligação",
    whatsapp_call: "realizou uma ligação via WhatsApp",
    whatsapp_message: "enviou uma mensagem via WhatsApp",
    email: "enviou um e-mail",
    other: "realizou um contato",
  }

  const action = actionMap[interactionType] || "realizou um contato"

  return `Acompanhamento necessário: ${action} em ${formattedDate}. Verifique o status e realize o próximo contato.`
}

export const action = async ({ request, params }: Route.ActionArgs) => {
  console.log("Creating interaction...")
  const user = await getUserOrRedirect(request)

  const formData = Object.fromEntries(await request.formData())

  const leadId = params.id

  const { success, error, data } = createInteractionSchema.safeParse({
    leadId,
    ...formData,
    contactedAt: new Date(),
    sellerId: user.id,
  })

  if (!success) {
    console.log("Validation error", error)
    return {
      error: true,
      message: "Invalid input",
      details: error,
    }
  }

  const interaction = await InteractionService.create({
    leadId,
    contactedAt: new Date(),
    sellerId: user.id,
    status: data.interactionStatus,
    interactionType: data.interactionType,
    notes: data.notes,
  })

  let reminder: DomainReminder | null = null
  if (data.reminder !== "disabled") {
    reminder = await ReminderService.create({
      leadId,
      sellerId: user.id,
      message: generateReminderMessage(data.interactionType, new Date()),
      remindIn: data.reminder,
    })
  }

  return {
    ok: true,
    interaction,
    reminder,
  }

}
