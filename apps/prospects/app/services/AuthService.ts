import { env } from '~/utils/env'
import { auauthUserSchema, loginResponseSchema } from './auauthApiClient'
import UserService, { type DomainUser } from './UserService'


class AuthService {
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

        const parsed = auauthUserSchema.safeParse(await res.json())

        if (!parsed.success) {
            console.log("Invalid remote user data", parsed.error)
            return null
        }

        const dbUser = await UserService.findByAuauthId(parsed.data.id)

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
}

export default new AuthService()