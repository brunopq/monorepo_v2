import { endOfYear, startOfYear } from "date-fns";
import { between, sql } from "drizzle-orm";

import { validateDate } from "~/lib/verifyMonthAndYear";

import { db } from "~/db";
import { sale } from "~/db/schema";

class IndicationService {
    async getIndications(year: number) {
        const date = validateDate(1, year);

        return await db.select({
            personName: sale.indication,
            totalIndications: sql<number>`count(${sale.id})`
        }).from(sale)
            .where(
                between(
                    sale.date,
                    startOfYear(date).toDateString(),
                    endOfYear(date).toDateString(),
                )
            )
            .groupBy(sale.indication);
    }
}
export default new IndicationService();