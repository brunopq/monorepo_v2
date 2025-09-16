import { z } from "zod/v4"
import { eq } from "drizzle-orm"

import {
    interactionStatuses,
    interactionTypes,
} from "~/constants/interactions"

import { db } from "../db"
import { leadInteractions } from "../db/schema"

export const interactionTypeSchema = z.enum(interactionTypes)
export const interactionStatusSchema = z.enum(interactionStatuses)

export type InteractionTypes = z.infer<typeof interactionTypeSchema>
export type InteractionStatuses = z.infer<typeof interactionStatusSchema>


export const domainInteractionSchema = z.object({
    id: z.string(),
    leadId: z.number(),
    sellerId: z.string(),
    contactedAt: z.date(),
    interactionType: interactionTypeSchema,
    status: interactionStatusSchema,
    notes: z.string().optional(),
})

export type DomainInteraction = z.infer<typeof domainInteractionSchema>

export const newInteractionSchema = domainInteractionSchema.omit({ id: true })

export type NewDomainInteraction = z.infer<typeof newInteractionSchema>

class InteractionService {
    async create(newInteraction: NewDomainInteraction) {
        const interaction = await db.insert(leadInteractions).values({
            leadId: newInteraction.leadId,
            sellerId: newInteraction.sellerId,
            contactedAt: new Date(newInteraction.contactedAt),
            interactionType: newInteraction.interactionType,
            status: newInteraction.status,
            notes: newInteraction.notes || undefined,
        })

        return interaction
    }

    async delete(interactionId: string) {
        console.log("Deleting interaction with ID:", interactionId)
        const deleted = await db.delete(leadInteractions).where(
            eq(leadInteractions.id, interactionId)
        )

        return deleted
    }
}

export default new InteractionService()
