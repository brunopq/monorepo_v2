import { and, eq, sql } from "drizzle-orm"
import { z } from "zod/v4"

import { interactionStatuses } from "../constants/interactions"
import { subListStates } from "../constants/subList"

import { db } from "~/db"
import { leadInteractions, leads, subLists } from "~/db/schema"

import type { InteractionStatuses } from "./InteractionService"

export { subListStates } from "../constants/subList"

export const subListStatesSchema = z.enum(subListStates)

export type SubListState = (typeof subListStates)[number]

export type DbSubList = typeof subLists.$inferSelect

class SubListService {
    async getById(id: string) {
        return await db.query.subLists.findFirst({
            where: (subLists, { eq }) => eq(subLists.id, id),
        })
    }

    // TODO: optimize the aggregation step, ideally make one query per method
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
                const c = await db.$count(leads, eq(leads.subListId, sl.id))

                return { ...sl, leadsCount: c }
            }),
        )

        return slsWithCounts
    }

    async getForUser(userId: string) {
        const sls = await db.query.subLists.findMany({
            where: (subLists, { eq }) => eq(subLists.assigneeId, userId),
            with: {
                assignee: true,
                parentList: true,
            },
            orderBy: (subLists, { asc }) => asc(subLists.id),
        })

        const slsWithCounts = await Promise.all(
            sls.map(async (sl) => {
                const { contactedLeadsCount, leadsCount } = await this.countLeads(sl.id)

                const ranked = db.$with("ranked_interactions").as(
                    db
                        .select({
                            lead_id: leads.id,
                            status: leadInteractions.status,
                            status_rank: sql`CASE ${leadInteractions.status}
                            WHEN 'converted' THEN 1
                            WHEN 'interested' THEN 2
                            WHEN 'waiting_response' THEN 3
                            WHEN 'no_response' THEN 4
                            WHEN 'wrong_person' THEN 5
                            WHEN 'no_interest' THEN 6
                            WHEN 'not_reachable' THEN 7
                            WHEN 'lost' THEN 8
                            ELSE 999 END`.as("status_rank"),
                            rn: sql`ROW_NUMBER() OVER (PARTITION BY ${leads.id} ORDER BY
                            CASE ${leadInteractions.status}
                                WHEN 'converted' THEN 1
                                WHEN 'interested' THEN 2
                                WHEN 'waiting_response' THEN 3
                                WHEN 'no_response' THEN 4
                                WHEN 'wrong_person' THEN 5
                                WHEN 'no_interest' THEN 6
                                WHEN 'not_reachable' THEN 7
                                WHEN 'lost' THEN 8
                                ELSE 999 END
                            )`.as("rn"),
                        })
                        .from(leads)
                        .leftJoin(leadInteractions, eq(leads.id, leadInteractions.leadId))
                        .where(eq(leads.subListId, sl.id)),
                )

                const result = await db
                    .with(ranked)
                    .select({
                        status: ranked.status,
                        lead_count: sql<number>`COUNT(*)`,
                    })
                    .from(ranked)
                    .where(sql`rn = 1`)
                    .groupBy(ranked.status)
                    .orderBy(sql`MIN(${ranked.status_rank})`)

                const record = Object.fromEntries(
                    interactionStatuses.map((status) => [
                        status,
                        Number(result.find((r) => r.status === status)?.lead_count || 0),
                    ]),
                ) as Record<InteractionStatuses, number>

                return { ...sl, leadsCount, contactedLeadsCount, record }
            }),
        )

        return slsWithCounts
    }

    async countLeads(subListId: string) {
        const [{ contactedLeadsCount, leadsCount }] = await db
            .select({
                leadsCount: sql`count(distinct ${leads.id}) as leads_count`,
                contactedLeadsCount: sql`count(distinct ${leadInteractions.leadId}) as contacted_leads_count`,
            })
            .from(leads)
            .leftJoin(leadInteractions, eq(leads.id, leadInteractions.leadId))
            .where(eq(leads.subListId, subListId))

        return {
            leadsCount,
            contactedLeadsCount
        }
    }

    async getWithLeads(id: string) {
        const subList = await db.query.subLists.findFirst({
            where: (subLists, { eq }) => eq(subLists.id, id),
            with: {
                assignee: true,
                leads: {
                    with: {
                        interactions: true,
                        reminders: true,
                    },
                    orderBy: (leads, { asc }) => asc(leads.id),
                },
            },
        })

        if (!subList) {
            return null
        }

        const { contactedLeadsCount, leadsCount } = await this.countLeads(id)

        return { ...subList, leadsCount, contactedLeadsCount }
    }

    async assign(id: string, assigneeId: string) {
        const updatedSubList = await db
            .update(subLists)
            .set({ assigneeId })
            .where(eq(subLists.id, id))
            .returning()

        return updatedSubList[0]
    }

    async updateStatus(id: string, status: SubListState) {
        const updatedSubList = await db
            .update(subLists)
            .set({ state: status })
            .where(eq(subLists.id, id))
            .returning()

        return updatedSubList[0]
    }

    async delete(id: string) {
        const subList = await this.getById(id)

        if (!subList) {
            throw new Error(`SubList with id ${id} not found`)
        }

        if (subList.state !== "new") {
            throw new Error(
                `SubList with id ${id} cannot be deleted because it is not in the 'new' state`,
            )
        }

        await db
            .update(leads)
            .set({ subListId: null })
            .where(eq(leads.subListId, id))

        const deletedSubList = await db
            .delete(subLists)
            .where(eq(subLists.id, id))
            .returning()

        return deletedSubList[0]
    }
}

export default new SubListService()
