import { db } from '~/db'
import { leads } from '~/db/schema'
import type { DomainInteraction } from './InteractionService'

type DbLead = typeof leads.$inferSelect
type NewDbLead = typeof leads.$inferInsert

export type DomainLead = {
    id: string;
    name: string;
    listId: string;
    // subListId: string | null;
    phoneNumber: string;
    cpf: string;
    birthDate: string | null;
    state: string | null;
    extra: Record<string, string> | null;
}

export type DomainLeadWithInteractions = DomainLead & {
    interactions: DomainInteraction[];
}

export type NewDomainLead = Omit<DomainLead, 'id'>

class LeadService {
    async createMany(newLeads: NewDomainLead[]): Promise<DomainLead[]> {
        const dbLeads: NewDbLead[] = newLeads.map(l => {
            const extra = { ...l.extra }
            // biome-ignore lint/complexity/noForEach: <explanation>
            Object.entries(extra).forEach(([k, v]) => {
                if (k in ["Nome", "CPF", "Telefone", "Data de Nascimento", "Estado"]) {
                    delete extra[k]
                }
            })

            return ({
                ...l,
                extraInfo: extra
            })
        })

        const a = await db.insert(leads).values(dbLeads).returning()

        return a.map(l => ({
            ...l,
            extra: l.extraInfo as Record<string, string>,
        }))
    }
}

export default new LeadService()