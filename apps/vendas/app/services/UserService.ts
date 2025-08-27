import { and, between, desc, eq, not, sql } from "drizzle-orm"
import { endOfMonth, startOfMonth } from "date-fns"

import { sale, user } from "~/db/schema"
import { db } from "~/db"

import { validateDate } from "~/lib/verifyMonthAndYear"

import CalculateUserComissionUseCase from "./useCases/CalculateUserComissionUseCase"
import { remoteUserSchema, type DomainUser } from "./AuthService"
import { env } from "~/lib/envConfig"

class UserService {
  async index() {
    throw new Error("Method not implemented")
    // const users = await db
    //   .select({
    //     id: user.id,
    //     name: user.name,
    //     fullName: user.fullName,
    //     role: user.role,
    //     totalSales: sql<number>`cast(count(${sale.id}) as int)`,
    //   })
    //   .from(user)
    //   .leftJoin(sale, eq(user.id, sale.seller))
    //   .groupBy(user.id)

    // return users
  }

  async listByMonth(
    jwt: string,
    month: number,
    year: number,
    options = { onlyActive: true },
  ) {
    const date = validateDate(month, year)

    const dbUsers = await db
      .select({
        id: user.id,
        name: user.name,
        fullName: user.fullName,
        auauthId: user.auauthId,
        // role: user.role,
        // accountActive: user.accountActive,
        totalSales: sql<number>`cast(count(${sale.id}) as int)`,
      })
      .from(user)
      // .where(options.onlyActive ? eq(user.accountActive, true) : undefined)
      .leftJoin(
        sale,
        and(
          eq(user.id, sale.seller),
          between(
            sale.date,
            startOfMonth(date).toDateString(),
            endOfMonth(date).toDateString(),
          ),
        ),
      )
      .groupBy(user.id)
    // .orderBy(desc(user.accountActive))

    const users = await Promise.all(
      dbUsers.map(async (dbUser) => {
        const remoteUserRes = await fetch(
          `${env.AUTH_SERVICE_URL}/users/${dbUser.auauthId}`,
          { headers: { Authorization: `Bearer ${jwt}` } }
        )

        if (!remoteUserRes.ok || remoteUserRes.headers.get("content-type") !== "application/json") {
          throw new Error("Remote user not found")
        }

        const remoteUser = remoteUserSchema.safeParse(await remoteUserRes.json())

        if (!remoteUser.success) {
          throw new Error("Invalid remote user data")
        }

        return {
          ...remoteUser.data,
          ...dbUser,
        }
      }),
    )

    return users
  }

  async listWithComissions(
    jwt: string,
    month: number,
    year: number,
    options = { onlyActive: false },
  ) {
    const users = await this.listByMonth(jwt, month, year, options)

    const usersWithComissions = await Promise.all(
      users.map(async (user) => {
        const comission = await CalculateUserComissionUseCase.execute(
          user.id,
          month,
          year,
        )

        return {
          ...user,
          comission,
        }
      }),
    )

    return usersWithComissions
  }

  async getByName(name: string): Promise<DomainUser> {
    throw new Error("Method not implemented")
    // const user = await db.query.user.findFirst({
    //   where: (user, { eq }) => eq(user.name, name),
    //   columns: {
    //     id: true,
    //     name: true,
    //     fullName: true,
    //     role: true,
    //     passwordHash: false,
    //     accountActive: true,
    //   },
    // })

    // if (!user) {
    //   throw new Error("User not found")
    // }

    // return user
  }
}

export default new UserService()
