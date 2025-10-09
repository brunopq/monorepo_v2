import z from "zod"
import { endOfYear, startOfYear } from "date-fns"
import { and, between, eq, isNotNull, or, sql } from "drizzle-orm"

import { validateDate } from "~/lib/verifyMonthAndYear"

import { db } from "~/db"
import { sale } from "~/db/schema"

const getReferrersOptionsSchema = z.object({
  year: z.number(),
  includeUsers: z.boolean().default(false),
})

export type GetReferrersOptions = z.infer<typeof getReferrersOptionsSchema>

class IndicationService {
  async getIndications(year: number) {
    const date = validateDate(1, year)

    const referrals = await db
      .select({
        referrerName: sale.indication,
        totalIndications: sql<number>`count(${sale.id})`.as(
          "total_indications",
        ),
      })
      .from(sale)
      .where(
        and(
          isNotNull(sale.indication),
          between(
            sale.date,
            startOfYear(date).toDateString(),
            endOfYear(date).toDateString(),
          ),
        ),
      )
      .groupBy(sale.indication)
      .orderBy(sql`total_indications desc`)

    return referrals.filter((r) => r.referrerName !== null) as {
      referrerName: string
      totalIndications: number
    }[]
  }

  async getUserIndications(year: number, userId: string) {
    const date = validateDate(1, year)

    const user = await db.query.user.findFirst({
      where: (u, { eq }) => eq(u.id, userId),
    })

    if (!user) {
      throw new Error("User not found")
    }

    const [{ indicationsCount }] = await db
      .select({
        indicationsCount: sql<number>`cast(count(${sale.id}) as int)`,
      })
      .from(sale)
      .where(
        and(
          or(
            eq(sale.indication, user.name),
            user.fullName ? eq(sale.indication, user.fullName) : undefined,
          ),
          between(
            sale.date,
            startOfYear(date).toDateString(),
            endOfYear(date).toDateString(),
          ),
        ),
      )

    return indicationsCount || 0
  }

  async getReferrers(options: GetReferrersOptions) {
    const date = validateDate(1, options.year)

    const referrers = await db
      .selectDistinct({
        referrerName: sale.indication,
      })
      .from(sale)
      .where(
        and(
          isNotNull(sale.indication),
          between(
            sale.date,
            startOfYear(date).toDateString(),
            endOfYear(date).toDateString(),
          ),
        ),
      )

    if (options.includeUsers) {
      // TODO: I know this is bad, but it is fast
      const users = await db.query.user.findMany({
        columns: {
          fullName: true,
        },
        where: (u, { isNotNull }) => isNotNull(u.fullName),
      })

      referrers.push(
        ...users.map((u) => ({
          referrerName: u.fullName,
        })),
      )
    }

    return referrers.filter((r) => r.referrerName !== null) as {
      referrerName: string
    }[]
  }
}
export default new IndicationService()
