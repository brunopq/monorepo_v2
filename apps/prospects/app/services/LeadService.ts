import { db } from "~/db"
import { leads } from "~/db/schema"

import type { DomainInteraction } from "./InteractionService"
import type { DomainReminder } from "./ReminderService"

type DbLead = typeof leads.$inferSelect
type NewDbLead = typeof leads.$inferInsert

export type DomainLead = {
    id: number
    // name: string
    listId: string
    subListId: string | null;
    // phoneNumber: string
    // cpf: string
    // birthDate: string | null
    // state: string | null
    extra: Record<string, string>
}

export type DomainLeadWithInteractions = DomainLead & {
    interactions: DomainInteraction[]
}

export type CompleteDomainLead = DomainLead & {
    interactions: DomainInteraction[]
    reminders: DomainReminder[]
}

export type NewDomainLead = Omit<DomainLead, "id">

const MAX_LEADS_PER_BATCH = 1000

class LeadService {
    async createMany(newLeads: NewDomainLead[]): Promise<DomainLead[]> {
        console.log(`creating ${newLeads.length} leads`)

        const dbLeads: NewDbLead[] = newLeads.map((l) => ({
            ...l,
            extraInfo: l.extra,
        }))

        const createdLeads: DbLead[] = []

        for (let i = 0; i < dbLeads.length; i += MAX_LEADS_PER_BATCH) {
            console.log(`inserting leads ${i} to ${i + MAX_LEADS_PER_BATCH}`)
            const batch = dbLeads.slice(i, i + MAX_LEADS_PER_BATCH)
            console.log(`batch size: ${batch.length}`)

            createdLeads.concat(await db.insert(leads).values(batch))
        }


        return createdLeads.map((l) => ({
            ...l,
            extra: l.extraInfo as Record<string, string>,
        }))
    }
}

export default new LeadService()
