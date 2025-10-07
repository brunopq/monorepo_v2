import {
  char,
  date,
  pgTable,
  pgEnum,
  text,
  boolean,
  numeric,
  integer,
  uuid,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { customAlphabet } from "nanoid"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

const idLength = 12
const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  idLength,
)

export const captationTypes = pgEnum("captation_type", ["ATIVO", "PASSIVO"])

export const userRoles = pgEnum("user_roles", ["ADMIN", "SELLER"])

export const user = pgTable("users", {
  id: char("id", { length: idLength }).$defaultFn(nanoid).primaryKey(),
  auauthId: uuid("auauth_id").notNull().unique(),
  name: text("name").notNull().unique(),
  fullName: text("full_name"),
  // role: userRoles("user_role").notNull(),
  // passwordHash: text("password_hash").notNull(),
  // accountActive: boolean("account_active").default(true).notNull(),
})

export const userRelations = relations(user, ({ many }) => ({
  sales: many(sale),
}))

export const campaign = pgTable("campaigns", {
  id: char("id", { length: idLength }).$defaultFn(nanoid).primaryKey(),
  name: text("name").notNull(),
  goal: integer("goal").notNull(),
  prize: numeric("prize", { precision: 16, scale: 2 }).notNull(),
  individualPrize: numeric("individual_prize", {
    precision: 16,
    scale: 2,
  })
    .default("0")
    .notNull(),
  month: date("month").defaultNow().notNull(),
})

export const campaignRelations = relations(campaign, ({ many }) => ({
  sales: many(sale),
}))

export const origin = pgTable("origins", {
  id: char("id", { length: idLength }).$defaultFn(nanoid).primaryKey(),
  name: text("name").notNull(),
  active: boolean("active").default(true).notNull(),
})

export const originRelations = relations(origin, ({ many }) => ({
  sales: many(sale),
}))

export const sale = pgTable("sales", {
  id: char("id", { length: idLength }).$defaultFn(nanoid).primaryKey(),
  date: date("date").notNull(),
  seller: char("seller", { length: idLength })
    .references(() => user.id)
    .notNull(),
  captationType: captationTypes("captation_type").notNull(),
  campaign: char("campaign", { length: idLength })
    .references(() => campaign.id)
    .notNull(),
  origin: char("origin", { length: idLength }).references(() => origin.id),
  // TODO: make a separate table, integrate with CRM...
  client: text("client").notNull(),
  adverseParty: text("adverse_party").notNull(),
  isRepurchase: boolean("is_repurchase").notNull(),
  estimatedValue: numeric("estimated_value", {
    precision: 16,
    scale: 2,
  }),
  comments: text("comments"),
  indication: text("indication"),
})

export const saleRelations = relations(sale, ({ one }) => ({
  seller: one(user, { fields: [sale.seller], references: [user.id] }),
  campaign: one(campaign, {
    fields: [sale.campaign],
    references: [campaign.id],
  }),
  origin: one(origin, { fields: [sale.origin], references: [origin.id] }),
}))

//
// types and schemas

export const captationTypeSchema = (params?: z.core.$ZodEnumParams) =>
  z.enum(captationTypes.enumValues, params)
export const userRoleSchmea = (params?: z.core.$ZodEnumParams) =>
  z.enum(userRoles.enumValues, params)

export const userSchema = createSelectSchema(user)
export const newUserSchema = createInsertSchema(user)

export const campaignSchema = createSelectSchema(campaign)
export const newCampaignSchema = createInsertSchema(campaign)

export const originSchema = createSelectSchema(origin)
export const newOriginSchema = createInsertSchema(origin)

export const saleSchema = createSelectSchema(sale)
export const newSaleSchema = createInsertSchema(sale)

export type CaptationType = z.infer<ReturnType<typeof captationTypeSchema>>
export type UserRole = z.infer<ReturnType<typeof userRoleSchmea>>

export type User = z.infer<typeof userSchema>
export type NewUser = z.infer<typeof newUserSchema>

export type Campaign = z.infer<typeof campaignSchema>
export type NewCampaign = z.infer<typeof newCampaignSchema>

export type Origin = z.infer<typeof originSchema>
export type NewOrigin = z.infer<typeof newOriginSchema>

export type Sale = typeof sale.$inferSelect
export type NewSale = typeof sale.$inferInsert
