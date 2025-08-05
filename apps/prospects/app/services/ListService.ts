import { db } from "~/db"
import { leads, lists, subLists } from "~/db/schema"

import type { DomainUser } from "./UserService"
import { and, eq, inArray, isNull } from "drizzle-orm"

type DbList = typeof lists.$inferSelect
type NewDbList = typeof lists.$inferSelect

export type DomainList = {
    id: string
    name: string
    createdBy: DomainUser
    createdAt: Date
    origin: string
    size: number
}
type NewDomainList = Omit<DomainList, "id" | "createdAt">

class ListService {
    async getAll(): Promise<DbList[]> {
        return await db.query.lists.findMany()
    }

    async create(list: NewDomainList): Promise<DomainList> {
        const [l] = await db
            .insert(lists)
            .values({
                ...list,
                creatorId: list.createdBy.id,
            })
            .returning()

        return {
            ...l,
            createdBy: list.createdBy,
        }
    }

    async getById(id: string) {
        const list = await db.query.lists.findFirst({
            where: (lists, { eq }) => eq(lists.id, id),
            // extras: {
            //     leadsCount: db.$count(leads, eq(leads.listId, id)).as("leads_count"),
            // },
            with: {
                createdBy: true,
            },
        })

        const leadsCount = await db.$count(leads, eq(leads.listId, id))

        const freeLeadsCount = await db.$count(
            leads,
            and(eq(leads.listId, id), isNull(leads.subListId)),
        )

        if (!list) return null

        return {
            ...list,
            leadsCount,
            freeLeadsCount,
        }
    }

    async makeSubLists(
        listId: string,
        sl: { leadsCount: number; assigneeId?: string }[],
    ) {
        await db.transaction(async (t) => {
            for (const sublist of sl) {
                const [createdSl] = await t.insert(subLists)
                    .values({
                        parentListId: listId,
                        assigneeId: sublist.assigneeId,
                        state: "new" as const,
                    }).returning()

                const leadsToAssign = await t
                    .select({ id: leads.id })
                    .from(leads)
                    .where(and(eq(leads.listId, listId), isNull(leads.subListId)))
                    .limit(sublist.leadsCount)

                if (leadsToAssign.length > 0) {
                    await t
                        .update(leads)
                        .set({
                            subListId: createdSl.id,
                        })
                        .where(
                            inArray(
                                leads.id,
                                leadsToAssign.map((l) => l.id),
                            ),
                        )
                }
            }
        })
    }
}

export default new ListService()
