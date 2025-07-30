import { db } from '../db'
import type { users } from '../db/schema'

export type DbUser = (typeof users.$inferSelect)

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
    async findByAuauthId(auauthId: string): Promise<DbUser | null> {
        const user = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.auauthId, auauthId),
        })

        if (!user) {
            return null
        }

        return user
    }
}

export default new UserService()