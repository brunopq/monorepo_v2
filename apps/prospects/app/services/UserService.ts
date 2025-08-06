import { db } from '../db'
import { users } from '../db/schema'

import { auauthUserSchema } from './auauthApiClient'

export type DbUser = (typeof users.$inferSelect)
export type DbInsertUser = (typeof users.$inferInsert)

export type UserRoles = 'ADMIN' | 'SELLER'

export type DomainUser = {
    id: string
    auauthId: string
    name: string,
    fullName?: string | null
    role: UserRoles
    accountActive: boolean
}

class UserService {
    private async getAuauthUser(jwt: string, auauthId: string) {
        const res = await fetch(`${process.env.AUTH_SERVICE_URL}/users/${auauthId}`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${jwt}`
            },
        })

        if (!res.ok || res.headers.get('content-type') !== 'application/json') {
            console.log('Failed to fetch user from auth service', res.status, await res.text())
            return null
        }

        const json = await res.json()
        const parsed = auauthUserSchema.safeParse(json)

        if (parsed.error) {
            console.log('Invalid response from auth service', parsed.error)
            return null
        }

        return parsed.data
    }

    async findAllDb(): Promise<DbUser[]> {
        const allUsers = await db.query.users.findMany({
            orderBy: (users, { asc }) => asc(users.name),
        })

        return allUsers
    }

    async findAll(jwt: string): Promise<DomainUser[]> {
        const allUsers = await this.findAllDb()

        const fullUsers = await Promise.all(
            allUsers.map(async (u) => {
                const auauthUser = await this.getAuauthUser(jwt, u.auauthId)
                return auauthUser ? {
                    id: u.id,
                    auauthId: u.auauthId,
                    name: u.name,
                    fullName: u.fullName,
                    role: auauthUser.role,
                    accountActive: auauthUser.accountActive,
                } : null
            })
        )

        return fullUsers.filter((u) => u !== null)
    }

    async findByAuauthId(auauthId: string): Promise<DbUser | null> {
        const user = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.auauthId, auauthId),
        })

        if (!user) {
            return null
        }

        return user
    }

    async findByName(name: string): Promise<DbUser | null> {
        const user = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.name, name),
        })

        if (!user) {
            return null
        }

        return user
    }

    /**
     * Creates a new user in the database.
     * 
     * Different from `create` (not yet implemented), which also creates the user in the Auauth service.
     */
    async createLocal(user: DbInsertUser): Promise<DbUser> {
        const [createdUser] = await db.insert(users)
            .values(user)
            .returning()

        return createdUser
    }
}

export default new UserService()