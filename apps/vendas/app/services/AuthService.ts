import { eq, sql } from "drizzle-orm"
import {z} from 'zod'

import { env } from "~/lib/envConfig"
import { encryptPassword, verifyPassword } from "~/lib/hashing"

import { db } from "~/db"
import { sale, user, type User } from "~/db/schema"

const remoteUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  // passwordHash: z.string(),
  fullName: z.string().nullable(),
  role: z.enum(['ADMIN', 'SELLER']),
  accountActive: z.boolean(),
})

const loginResponseSchema = z.object({
  token: z.string(),
  user: remoteUserSchema,
})

type RemoteUser = z.infer<typeof remoteUserSchema>

export type DomainUser = Omit<User, "passwordHash"> & {
  role: "ADMIN" | "SELLER"
  accountActive: boolean
}
export type NewUser = Omit<DomainUser, "id">
export type LoginUser = {
  name: string
  password: string
}
export type UpdateUser = Partial<Omit<DomainUser, "id">>

class AuthService {
  async index() {
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        fullName: user.fullName,
        // role: user.role,
        totalSales: sql<number>`cast(count(${sale.id}) as int)`,
      })
      .from(user)
      .leftJoin(sale, eq(user.id, sale.seller))
      .groupBy(user.id)

    return users
  }

  async getByName(name: string, jwt: string): Promise<DomainUser> {
    const user = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.name, name),
      columns: {
        id: true,
        name: true,
        fullName: true,
        auauthId: true,
        // role: true,
        // passwordHash: false,
        // accountActive: true,
      },
    })

    if (!user) {
      throw new Error("User not found")
    }

    const remoteUserRes = await fetch(
      `${env.AUTH_SERVICE_URL}/users/${user.auauthId}`, 
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
      ...user,
    }
  }

  async validateJWT(jwt: string): Promise<DomainUser | null> {
    console.log('validating jwt', jwt)
    const res = await fetch(`${env.AUTH_SERVICE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    })

    if (!res.ok || res.headers.get("content-type") !== "application/json") {
      console.log("Invalid JWT")
      return null
    }

    console.log(res)
    const parsed = remoteUserSchema.safeParse(await res.json())

    if (!parsed.success) {
      console.log("Invalid remote user data", parsed.error)
      return null
    }

    const dbUser = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.auauthId, parsed.data.id),
    })

    if (!dbUser) {
      console.log("User not found in local database")
      // TODO: handle this
      return null
    }

    return {
      ...parsed.data,
      ...dbUser,
    } 
  }


  async login(userInfo: LoginUser): Promise<{ token: string; user: DomainUser }> {
    const res = await fetch(`${env.AUTH_SERVICE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: userInfo.name,
        password: userInfo.password,
      }),
    })

    if (!res.ok || res.headers.get("content-type") !== "application/json") {
      throw new Error("Invalid credentials")
    }

    const parsed = loginResponseSchema.safeParse(await res.json())

    if (!parsed.success) {
      console.log(parsed.error)
      throw new Error("Invalid credentials")
    }

    // the user
    const { token, user: remoteUser } = parsed.data
    // now we check if the user exists in our database
    // if not, we create it

    let dbUser = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.name, remoteUser.name),
    })

    if (!dbUser) {
      const [createdUser] = await db.insert(user)
      .values({
        name: remoteUser.name,
        fullName: remoteUser.fullName,
        auauthId: remoteUser.id,
      }).returning()

      dbUser = createdUser
    }

    return {
      token, 
      user: {
        ...remoteUser, ...dbUser,
      }
    }
  }

  // async passwordMatches(id: string, password: string): Promise<boolean> {
  //   const user = await db.query.user.findFirst({
  //     where: (user, { eq }) => eq(user.id, id),
  //   })

  //   if (!user) return false

  //   return await verifyPassword(password, user.passwordHash)
  // }

  async create(userInfo: NewUser): Promise<DomainUser> {
    throw new Error("Not implemented")
    // const [createdUser] = await db
    //   .insert(user)
    //   .values({
    //     name: userInfo.name,
    //     fullName: userInfo.fullName,
    //     auauthId: userInfo.auauthId,
    //   })
    //   .returning()

    // return createdUser
  }

  async changePassword(id: string, newPassword: string) {
    // const hashedPassword = await encryptPassword(newPassword)
   
    // const [updated] = await db
    //   .update(user)
    //   .set({
    //     passwordHash: hashedPassword,
    //   })
    //   .where(eq(user.id, id))
    //   .returning()
   
    // return {
    //   id: updated.id,
    //   name: updated.name,
    //   fullName: updated.fullName,
    //   role: updated.role,
    // }
  }

  async updateUser(id: string, fields: UpdateUser) {
    // call remote service

    // update user with response

    // const [updated] = await db
    //   .update(user)
    //   .set({
    //     name: fields.name,
    //     fullName: fields.fullName,
    //     role: fields.role,
    //     accountActive: fields.accountActive,
    //   })
    //   .where(eq(user.id, id))
    //   .returning()

    // return {
    //   id: updated.id,
    //   name: updated.name,
    //   fullName: updated.fullName,
    //   role: updated.role,
    //   accountActive: updated.accountActive,
    // }
  }

  async delete(id: string) {
    await db.delete(user).where(eq(user.id, id))
  }
}

export default new AuthService()
