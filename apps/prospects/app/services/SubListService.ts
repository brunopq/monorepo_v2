import { eq } from "drizzle-orm";
import { db } from "~/db";
import { leads } from "~/db/schema";

class SubListService {
    async getForList(listId: string) {
        const sls = await db.query.subLists.findMany({
            where: (subLists, { eq }) => eq(subLists.parentListId, listId),
            with: {
                assignee: true,
            },
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
}

export default new SubListService();