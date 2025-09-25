import WhatsappQueue from "./WhatsappMessageQueue"
import WhatsappMessageService from "./meta/WhatsappMessageService"
import MessagingCampaignService from "./MessagingCampaignService"

class OficialWhatsappAPIConsumer {
    async start() {
        console.log("Starting Oficial Whatsapp API Consumer...")

        WhatsappQueue.consume(async (payload) => {
            console.log('Processing message:', payload)

            try {

                const { success } = await WhatsappMessageService.sendMessage(payload.message)

                console.log('Message processed successfully:', payload)

                if (success) {
                    await MessagingCampaignService.updateMessageStatus(payload.messageId, 'sent')
                }
            } catch (e) {
                console.error('Error processing message:', payload, e)
                await MessagingCampaignService.updateMessageStatus(payload.messageId, 'failed', (e as Error).message)
            }
        })
    }
}

export default new OficialWhatsappAPIConsumer()