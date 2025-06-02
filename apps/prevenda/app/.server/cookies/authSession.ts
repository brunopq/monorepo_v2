import { createCookieSessionStorage, redirect } from "react-router"

import AuthService, {
  type User,
  type UserRole,
} from "~/.server/services/AuthService"

import { env } from "~/utils/envConfig.server"

const cookieSecret = env.COOKIE_SECRET

export type SessionData = {
  token: string
}

export const {
  commitSession,
  destroySession,
  getSession: _getSession,
} = createCookieSessionStorage<SessionData>({
  cookie: {
    name: "_session",
    sameSite: "lax",
    path: "/",
    httpOnly: false,
    secrets: [cookieSecret],
    secure: env.NODE_ENV === "production",
  },
})

export async function getSession(request: Request) {
  return await _getSession(request.headers.get("Cookie"))
}

export async function getToken(request: Request): Promise<string | null> {
  const session = await getSession(request)

  const user = session.get("token")

  return user ?? null
}

type Options = {
  redirectPath: string
  roles: UserRole[]
}

export async function getUserOrRedirect(
  request: Request,
  options: Options = { redirectPath: "/login", roles: ["ADMIN", "SELLER"] },
): Promise<User> {
  const session = await getSession(request)
  const token = session.get("token")

  if (!token) {
    throw redirect(options.redirectPath)
  }

  try {
    const user = await AuthService.getUserInfo(token)

    if (!options.roles.includes(user.role)) {
      throw redirect(options.redirectPath)
    }

    return user
  } catch (e) {
    throw redirect(options.redirectPath, {
      headers: { "Set-Cookie": await destroySession(session) },
    })
  }
}
