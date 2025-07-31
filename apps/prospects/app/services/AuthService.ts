import { env } from '~/utils/env'
import { auauthUserSchema, loginResponseSchema } from './auauthApiClient'
import UserService, { type DomainUser } from './UserService'

export type LoginUser = {
    name: string
    password: string
}

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

        let dbUser = await UserService.findByName(remoteUser.name)

        if (!dbUser) {
            const createdUser = await UserService.createLocal({
                name: remoteUser.name,
                fullName: remoteUser.fullName,
                auauthId: remoteUser.id,
            })

            dbUser = createdUser
        }

        return {
            token,
            user: {
                ...remoteUser,
                ...dbUser,
            }
        }
    }
}

export default new AuthService()