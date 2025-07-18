import { initContract } from "@ts-rest/core"
import { z } from "zod"

const c = initContract()

const auauthUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  fullName: z.string().nullable(),
  role: z.enum(["ADMIN", "SELLER"]),
  accountActive: z.boolean(),
})

const loginResponseSchema = z.object({
  token: z.string(),
  user: auauthUserSchema,
})

const router = c.router({
  login: {
    method: "POST",
    path: "/login",
    body: z.object({
      username: z.string(),
      password: z.string(),
    }),
    responses: {
      200: loginResponseSchema,
      401: z.object({
        message: z.string(),
      }),
    },
  },

  me: {
    method: "GET",
    path: "/users/me",
    headers: z.object({
      Authorization: z.string()
    }),
    responses: {
      200: auauthUserSchema,
      401: z.object({
        message: z.string(),
      }),
    },
  },

  list: {
    method: "GET",
    path: "/users",
    headers: z.object({
        Authorization: z.string()
    }),
    responses: {
        200: z.array(auauthUserSchema)
    }
  }
})
