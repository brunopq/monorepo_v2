import { db } from '~/db'
import { leads } from '~/db/schema'

type DbLead = typeof leads.$inferSelect
type NewDbLead = typeof leads.$inferInsert

export type DomainLead = {
    id: string;
    name: string;
    listId: string;
    // subListId: string | null;
    phoneNumber: string;
    cpf: string | null;
    birthDate: string | null;
    state: string | null;
    extra: Record<string, string> | null;
}

export type NewDomainLead = Omit<DomainLead, 'id'>

class LeadService {
    async createMany(newLeads: NewDomainLead[]): Promise<DomainLead[]> {
        const a = await db.insert(leads).values(newLeads.map(l => ({
            ...l,
            extraInfo: l.extra,
        }))).returning()

        return a.map(l => ({
            ...l,
            extra: l.extraInfo as Record<string, string>,
        }))
    }
}

export default new LeadService()