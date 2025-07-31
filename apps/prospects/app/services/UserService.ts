import { db } from '../db'
import { users } from '../db/schema'

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