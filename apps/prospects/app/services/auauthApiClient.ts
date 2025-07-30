import { z } from "zod/v3"

export const auauthUserSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    fullName: z.string().nullable(),
    role: z.enum(["ADMIN", "SELLER"]),
    accountActive: z.boolean(),
})

export const loginResponseSchema = z.object({
    token: z.string(),
    user: auauthUserSchema,
})
