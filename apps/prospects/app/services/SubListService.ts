import { eq } from "drizzle-orm";

import { db } from "~/db";
import { leads, subLists } from "~/db/schema";

export const subListStates = [
    'new',
    'in_progress',
    'completed',
    'canceled',
] as const;

export type SubListState = typeof subListStates[number];

class SubListService {
    async getForList(listId: string) {
        const sls = await db.query.subLists.findMany({
            where: (subLists, { eq }) => eq(subLists.parentListId, listId),
            with: {
                assignee: true,
            },
            orderBy: (subLists, { asc }) => asc(subLists.id),
        })

        const slsWithCounts = await Promise.all(
            sls.map(async (sl) => {
                const c = await db
                    .$count(leads, eq(leads.subListId, sl.id))

                return { ...sl, leadsCount: c }
            })
        )

        return slsWithCounts
    }

    async assign(id: string, assigneeId: string) {
        const updatedSubList = await db
            .update(subLists)
            .set({ assigneeId })
            .where(eq(subLists.id, id))
            .returning();

        return updatedSubList[0];
    }
}

export default new SubListService();