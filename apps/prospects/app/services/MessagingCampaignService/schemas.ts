import z from 'zod/v4'

import { messageStatuses, messagingCamapignTypes } from '~/constants/messagingCamapign'

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