import { differenceInMilliseconds } from "date-fns"

import WhatsappQueue from "./WhatsappMessageQueue"
import WhatsappMessageService from "./meta/WhatsappMessageService"
import MessagingCampaignService from "./MessagingCampaignService"
import InteractionService from "./InteractionService"

const THRESHOLD_MS = 30_000 // 30 seconds

class OficialWhatsappAPIConsumer {
    private lastCalled: Date | null = null

    async start() {
        WhatsappQueue.consume(async (payload) => {
          const now = new Date()
          if (
              this.lastCalled &&
              differenceInMilliseconds(now, this.lastCalled) < THRESHOLD_MS
          ) {
              console.log("Oficial Whatsapp API Consumer is in timeout, sleeping.")

              const time = THRESHOLD_MS - differenceInMilliseconds(now, this.lastCalled)

              await new Promise((resolve) => setTimeout(resolve, time))
          }

          this.lastCalled = now

          console.log("Processing message:", payload.messageId)

          try {
            const { success } = await WhatsappMessageService.sendMessage(
                payload.message,
            )

            console.log("Message processed successfully:", payload)

            if (success) {
                await MessagingCampaignService.updateMessageStatus(
                    payload.messageId,
                    "sent",
                )
                await InteractionService.create({
                    contactedAt: new Date(),
                    leadId: payload.leadId,
                    status: "waiting_response",
                    interactionType: "whatsapp_message",
                    notes: `Mensagem enviada automaticamente via WhatsApp por uma campanha (${payload.campaign.name}) pelo número ${payload.message.to}.`,
                })
            }
        } catch (e) {
              console.error("Error processing message:", payload, e)
              await MessagingCampaignService.updateMessageStatus(
                  payload.messageId,
                  "failed",
                  (e as Error).message,
              )

              await InteractionService.create({
                  contactedAt: new Date(),
                  leadId: payload.leadId,
                  status: "not_reachable",
                  interactionType: "whatsapp_message",
                  notes: `Falha ao enviar mensagem automaticamente via WhatsApp por uma campanha (${payload.campaign.name}) pelo número ${payload.message.to}.\nErro: ${(e as Error).message}`,
              })
          }
      })
    }
}

export default new OficialWhatsappAPIConsumer()
