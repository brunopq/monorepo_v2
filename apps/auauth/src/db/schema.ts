import { boolean, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core"

import { userRoles as userRolesValues } from '../dtos'

export const userRoles = pgEnum("user_roles", userRolesValues)

export const user = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull().unique(),
  passwordHash: text().notNull(),
  fullName: text(),
  role: userRoles().notNull(),
  accountActive: boolean().default(true).notNull(),
})

