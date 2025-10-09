import { endOfYear, startOfYear } from "date-fns"
import { and, between, eq, isNotNull, or, sql } from "drizzle-orm"

import { validateDate } from "~/lib/verifyMonthAndYear"

import { db } from "~/db"
import { sale } from "~/db/schema"

class IndicationService {
  async getIndications(year: number) {
    const date = validateDate(1, year)

    return await db
      .select({
        referrerName: sale.indication,
        totalIndications: sql<number>`count(${sale.id})`.as(
          "total_indications",
        ),
      })
      .from(sale)
      .where(
        between(
          sale.date,
          startOfYear(date).toDateString(),
          endOfYear(date).toDateString(),
        ),
      )
      .groupBy(sale.indication)
      .orderBy(sql`total_indications desc`)
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

  async getReferrers(year: number) {
    const date = validateDate(1, year)

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

    return referrers.filter((r) => r.referrerName !== null) as {
      referrerName: string
    }[]
  }
}
export default new IndicationService()
