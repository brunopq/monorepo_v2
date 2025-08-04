import { db } from '~/db'
import { lists } from '~/db/schema'

import type { DomainUser } from './UserService'

type DbList = typeof lists.$inferSelect
type NewDbList = typeof lists.$inferSelect


export type DomainList = {
    id: string;
    name: string;
    createdBy: DomainUser;
    createdAt: Date;
    origin: string;
    size: number;
}
type NewDomainList = Omit<DomainList, 'id' | 'createdAt'>

class ListService {
    async getAll(): Promise<DbList[]> {
        return await db.query.lists.findMany()
    }

    async create(list: NewDomainList): Promise<DomainList> {
        const [l] = await db.insert(lists).values({
            ...list,
            creatorId: list.createdBy.id,
        }).returning()

        return {
            ...l,
            createdBy: list.createdBy,
        }
    }
}

export default new ListService();