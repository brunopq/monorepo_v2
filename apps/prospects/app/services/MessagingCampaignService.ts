import z from 'zod'

import { messageStatuses, messagingCamapignTypes } from '~/constants/messagingCamapign'

import { db } from '~/db'
import { messagingCampaign, oficialWhatsappAPIMessage } from '~/db/schema'

import WhatsappQueue from './WhatsappMessageQueue'
import { eq } from 'drizzle-orm'

const messagingCampaignTypeEnum = z.enum(messagingCamapignTypes)

export const domainMessagingCampaignSchema = z.object({
    id: z.string(),
    createdAt: z.coerce.date(),
    subListId: z.string(),
    name: z.string(),
    type: messagingCampaignTypeEnum,
})

export const newDomainMessagingCampaignSchema = domainMessagingCampaignSchema
    .omit({ id: true, createdAt: true })
    .extend({})

export type MessagingCampaignType = z.infer<typeof messagingCampaignTypeEnum>
export type DomainMessagingCampaign = z.infer<typeof domainMessagingCampaignSchema>
export type NewDomainMessagingCampaign = z.infer<typeof newDomainMessagingCampaignSchema>

const messageStatusEnum = z.enum(messageStatuses)

export const domainOficialWhatsappMessageSchema = z.object({
    id: z.string(),
    createdAt: z.coerce.date(),
    leadId: z.number(),
    campaginId: z.string().optional(),
    phoneNumber: z.string(),
    messageTemplateName: z.string(),
    templateParameters: z.record(z.string(), z.string()).optional(),
    renderedText: z.string(),
    sentAt: z.date().optional(),
    status: messageStatusEnum.optional(),
    error: z.string().optional(),
})

export const newDomainOficialWhatsappMessageSchema = domainOficialWhatsappMessageSchema
    .omit({ id: true, createdAt: true, sentAt: true, status: true, error: true })
    .extend({})

export type MessageStatus = z.infer<typeof messageStatusEnum>
export type DomainOficialWhatsappMessage = z.infer<typeof domainOficialWhatsappMessageSchema>
export type NewDomainOficialWhatsappMessage = z.infer<typeof newDomainOficialWhatsappMessageSchema>


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
        const messages = await db.query.oficialWhatsappAPIMessage.findMany({
            where: (msg, { eq, and }) => and(eq(msg.campaignId, campaignId), eq(msg.status, 'pending'))
        })

        for (const msg of messages) {
            await WhatsappQueue.publish({
                messageId: msg.id,
                campaignId: msg.campaignId,
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