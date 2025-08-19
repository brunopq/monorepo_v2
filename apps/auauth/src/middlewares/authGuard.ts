import { createMiddleware } from "hono/factory"
import { HTTPException } from "hono/http-exception"

import type { UserDTO, UserRole } from "../dtos"

export const authGuard = (...roles: UserRole[]) =>
  createMiddleware<{ Variables: { user: UserDTO } }>(async (c, next) => {
    const user = c.get("user")

    if (!roles.includes(user.role)) {
      throw new HTTPException(403, { message: "Forbidden" })
    }

    await next()
  })
