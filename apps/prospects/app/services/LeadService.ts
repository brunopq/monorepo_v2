import { db } from '~/db'
import type { leads } from '~/db/schema'

type DbLead = typeof leads.$inferSelect
type NewDbLead = typeof leads.$inferInsert

export type DomainLead = {
    id: string;
    name: string;
    // listId: string;
    // subListId: string | null;
    phoneNumber: string;
    cpf: string | null;
    birthDate: string | null;
    state: string | null;
    extra: Record<string, string> | null;
}

class LeadService {

}

export default new LeadService()