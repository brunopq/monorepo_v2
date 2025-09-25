import { relations, sql } from "drizzle-orm"
import {
    char,
    date,
    integer,
    jsonb,
    pgEnum,
    pgTable,
    serial,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core"
import { customAlphabet } from "nanoid"

import { interactionStatuses, interactionTypes } from "~/constants/interactions"
import { messageStatuses, messagingCamapignTypes } from "~/constants/messagingCamapign"
import { subListStates } from "~/constants/subList"

const idLength = 12
const nanoid = customAlphabet(
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    idLength,
)

const baseTable = {
    id: char("id", { length: idLength }).$defaultFn(nanoid).primaryKey(),
}

export const users = pgTable("users", {
    ...baseTable,
    auauthId: uuid().unique().notNull(),
    name: text().unique().notNull(),
    fullName: text(),
})

export const lists = pgTable("lists", {
    ...baseTable,
    creatorId: text()
        .references(() => users.id)
        .notNull(),
    createdAt: timestamp({ mode: "date", withTimezone: true })
        .notNull()
        .defaultNow(),
    name: text().notNull(),
    origin: text().notNull(),
    size: integer().notNull(),
})

/**
 *  ~All leads must have name and phone number, at least~
 *
 * All leads are a big jsonb blob, it is up to the user to provide the necessary fields
 */
export const leads = pgTable("leads", {
    id: serial().unique().primaryKey(),
    listId: text()
        .references(() => lists.id)
        .notNull(),
    subListId: text().references(() => subLists.id),
    extraInfo: jsonb(),
})

export const subListStatesEnum = pgEnum("sub_list_states", subListStates)

export const subLists = pgTable("sub_lists", {
    ...baseTable,
    parentListId: text()
        .references(() => lists.id)
        .notNull(),
    assigneeId: text().references(() => users.id),
    state: subListStatesEnum().notNull(),
})

export const interactionTypesEnum = pgEnum(
    "interaction_types",
    interactionTypes,
)

export const interactionStatusesEnum = pgEnum(
    "interaction_statuses",
    interactionStatuses,
)

export const leadInteractions = pgTable("lead_interactions", {
    ...baseTable,
    leadId: integer()
        .references(() => leads.id)
        .notNull(),
    sellerId: text()
        .references(() => users.id)
        .notNull(),
    contactedAt: timestamp({ mode: "date", withTimezone: true }).notNull(),
    interactionType: interactionTypesEnum().notNull(),
    status: interactionStatusesEnum().notNull(),
    notes: text(),
})

export const reminders = pgTable("reminders", {
    ...baseTable,
    leadId: integer()
        .references(() => leads.id)
        .notNull(),
    sellerId: text()
        .references(() => users.id)
        .notNull(),
    createdAt: timestamp({ mode: "date", withTimezone: true }).notNull(),
    remindAt: timestamp({ mode: "date", withTimezone: true }).notNull(),
    message: text().notNull(),
})

// const messagingCampaignStatusEnum = pgEnum("messaging_campaign_status", [
//     "running",
//     "completed",
// ])
export const messagingCampaignTypeEnum = pgEnum("messaging_campaign_type", messagingCamapignTypes)

export const messagingCampaign = pgTable("messaging_campaign", {
    ...baseTable,
    subListId: text()
        .references(() => subLists.id)
        .notNull(),
    name: text().notNull(),
    createdAt: timestamp({ mode: "date", withTimezone: true })
        .notNull()
        .defaultNow(),
    type: messagingCampaignTypeEnum().notNull(),
    // status: 
})

export const messageStatusEnum = pgEnum("message_status", messageStatuses)

export const oficialWhatsappAPIMessage = pgTable("oficial_whatsapp_api_message", {
    ...baseTable,
    campaignId: text()
        .references(() => messagingCampaign.id)
        .notNull(),
    leadId: integer()
        .references(() => leads.id)
        .notNull(),
    phoneNumber: text().notNull(),
    messageTemplateName: text().notNull(),
    templateParameters: jsonb().notNull().$type<Record<string, string>>(),
    renderedText: text().notNull(),
    sentAt: timestamp({ mode: "date", withTimezone: true }),
    status: messageStatusEnum().notNull().default("pending"),
    error: text(),
})

export const listRelations = relations(lists, ({ one, many }) => ({
    createdBy: one(users, {
        fields: [lists.creatorId],
        references: [users.id],
    }),
    leads: many(leads),
    subLists: many(subLists),
}))

export const leadRelations = relations(leads, ({ one, many }) => ({
    list: one(lists, {
        fields: [leads.listId],
        references: [lists.id],
    }),
    subList: one(subLists, {
        fields: [leads.subListId],
        references: [subLists.id],
    }),
    interactions: many(leadInteractions),
    reminders: many(reminders)
}))

export const subListRelations = relations(subLists, ({ one, many }) => ({
    parentList: one(lists, {
        fields: [subLists.parentListId],
        references: [lists.id],
    }),
    assignee: one(users, {
        fields: [subLists.assigneeId],
        references: [users.id],
    }),
    leads: many(leads),
}))

export const interactionRelations = relations(leadInteractions, ({ one }) => ({
    lead: one(leads, {
        fields: [leadInteractions.leadId],
        references: [leads.id],
    }),
    seller: one(users, {
        fields: [leadInteractions.sellerId],
        references: [users.id],
    }),
}))

export const reminderRelations = relations(reminders, ({ one }) => ({
    lead: one(leads, {
        fields: [reminders.leadId],
        references: [leads.id],
    }),
    seller: one(users, {
        fields: [reminders.sellerId],
        references: [users.id],
    }),
}))
