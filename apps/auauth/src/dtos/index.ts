import { z } from "zod/v4"

export const userRoles = ["ADMIN", "SELLER"] as const

export const userRolesSchema = z.enum(userRoles)

export type UserRole = z.infer<typeof userRolesSchema>

export const userSchema = z.object({
    id: z.uuidv4(),
    name: z.string(),
    passwordHash: z.string(),
    fullName: z.string().nullish(),
    role: userRolesSchema,
    accountActive: z.boolean(),
})

export type UserDTO = z.infer<typeof userSchema>

export const responseUserSchema = userSchema.pick({
    id: true,
    name: true,
    fullName: true,
    role: true,
    accountActive: true,
})

export type ResponseUserDTO = z.infer<typeof responseUserSchema>

export const newUserSchema = userSchema.pick({
    name: true,
    fullName: true,
    role: true,
    accountActive: true,
}).extend({
    password: z.string(),
})

export type NewUserDTO = z.infer<typeof newUserSchema>

export const updateUserSchema = newUserSchema.partial()

export type UpdateUserDTO = z.infer<typeof updateUserSchema>

export const loginSchema = z.object({
    username: z.string(),
    password: z.string(),
})

export type LoginDTO = z.infer<typeof loginSchema>

export const loginResponseSchema = z.object({
    token: z.string(),
    user: responseUserSchema,
})

export type LoginResponseDTO = z.infer<typeof loginResponseSchema>