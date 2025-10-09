import { endOfYear, startOfYear } from "date-fns"
import { and, between, isNotNull, sql } from "drizzle-orm"

import { validateDate } from "~/lib/verifyMonthAndYear"

import { db } from "~/db"
import { sale } from "~/db/schema"

class IndicationService {
  async getIndications(year: number) {
    const date = validateDate(1, year)

    return await db
      .select({
        personName: sale.indication,
        totalIndications: sql<number>`count(${sale.id})`,
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
