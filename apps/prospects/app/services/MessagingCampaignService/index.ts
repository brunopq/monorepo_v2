import { eq } from 'drizzle-orm'

import { db } from '~/db'
import { messagingCampaign, oficialWhatsappAPIMessage } from '~/db/schema'

import WhatsappQueue from '../WhatsappMessageQueue'

import type { MessageStatus, NewDomainMessagingCampaign, NewDomainOficialWhatsappMessage } from './schemas'

class MessagingCampaignService {
    async createCampaign(newCampaign: NewDomainMessagingCampaign, newMessages: NewDomainOficialWhatsappMessage[]) {
        const { createdCampaign, createdMessages } = await db.transaction(async (t) => {
            const [createdCampaign] = await t.insert(messagingCampaign).values(newCampaign).returning()

            const createdMessages = await t.insert(oficialWhatsappAPIMessage).values(
                newMessages.map((msg) => ({
                    ...msg,
                    campaignId: createdCampaign.id,
                    templateParameters: msg.templateParameters || {}
                })),
            ).onConflictDoNothing().returning()

            return { createdCampaign, createdMessages }
        })

        for (const msg of createdMessages) {
            await WhatsappQueue.publish({
                messageId: msg.id,
                campaignId: msg.campaignId,
                campaign: {
                    name: createdCampaign.name,
                },
                leadId: msg.leadId,
                message: {
                    to: msg.phoneNumber,
                    templateName: msg.messageTemplateName,
                    parameters: msg.templateParameters,
                }
            })
        }

        return { createdCampaign, createdMessages }
    }

    async scheduleCampaign(campaignId: string) {
        const campaign = await db.query.messagingCampaign.findFirst({
            where: (c, { eq }) => eq(c.id, campaignId),
        })

        if (!campaign) {
            throw new Error(`Campaign with ID ${campaignId} not found`)
        }

        const messages = await db.query.oficialWhatsappAPIMessage.findMany({
            where: (msg, { eq, and }) => and(eq(msg.campaignId, campaignId), eq(msg.status, 'pending'))
        })

        for (const msg of messages) {
            await WhatsappQueue.publish({
                messageId: msg.id,
                campaignId: msg.campaignId,
                campaign: {
                    name: campaign.name
                },
                leadId: msg.leadId,
                message: {
                    to: msg.phoneNumber,
                    templateName: msg.messageTemplateName,
                    parameters: msg.templateParameters,
                }
            })
        }
    }

    async updateMessageStatus(messageId: string, status: MessageStatus, error?: string) {
        const rows = await db.update(oficialWhatsappAPIMessage)
            .set({
                status,
                error: error || null,
                sentAt: status === 'sent' ? new Date() : undefined,
            })
            .where(eq(oficialWhatsappAPIMessage.id, messageId))
            .returning()

        if (rows.length === 0) {
            throw new Error(`Message with ID ${messageId} not found`)
        }

        return rows[0]
    }
}

export default new MessagingCampaignService()