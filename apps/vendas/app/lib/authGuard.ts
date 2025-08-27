import { redirect, type Session } from "react-router"

import AuthService, { type DomainUser } from "~/services/AuthService"
import { destroySession, getSession, type SessionData } from "~/session"

export async function getUserOrRedirect(
  request: Request,
  redirectPath: { noredirect: true },
): Promise<SessionData | null>
export async function getUserOrRedirect(
  request: Request,
  redirectPath?: string,
): Promise<SessionData>
export async function getUserOrRedirect(
  request: Request,
  redirectPath?: string | { noredirect: true },
): Promise<SessionData | null> {
  const session = await getSession(request)

  if (typeof redirectPath === "object" && "noredirect" in redirectPath) {
    try {
      return await assertUser(session)
    } catch (redirect) {
      return null
    }
  }

  return await assertUser(session, redirectPath)
}

export async function getAdminOrRedirect(
  request: Request,
  redirectPath: { noredirect: true },
): Promise<SessionData | null>
export async function getAdminOrRedirect(
  request: Request,
  redirectPath?: string,
): Promise<SessionData>
export async function getAdminOrRedirect(
  request: Request,
  redirectPath?: string | { noredirect: true },
): Promise<SessionData | null> {
  const session = await getSession(request)

  if (typeof redirectPath === "object" && "noredirect" in redirectPath) {
    try {
      return await assertAdmin(session)
    } catch (redirect) {
      return null
    }
  }

  return await assertAdmin(session, redirectPath)
}

export async function assertUser(
  session: Session<SessionData>,
  redirectPath = "/",
): Promise<SessionData> {
  console.log(session.data)
  const user = session.data.user
  const jwt = session.data.jwt
  if (!jwt || !user) {
    throw redirect(redirectPath, {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    })
  }
  try {
    const remoteUser = await AuthService.validateJWT(jwt)
    // const dbUser = await AuthService.getByName(user.name)

    if (!remoteUser?.accountActive) {
      throw redirect(redirectPath)
    }

    return {
      user: remoteUser,
      jwt
    }
  } catch (e) {
    throw redirect(redirectPath)
  }
}
export async function assertAdmin(
  session: Session<SessionData>,
  redirectPath = "/",
): Promise<SessionData> {
  const data = await assertUser(session, redirectPath)

  if (data.user.role !== "ADMIN") {
    throw redirect(redirectPath)
  }

  return data
}
