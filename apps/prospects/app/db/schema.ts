import { relations } from 'drizzle-orm'
import { char, date, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { customAlphabet } from 'nanoid'
import { interactionStatuses, interactionTypes } from '~/constants/interactions'

import { subListStates } from '~/services/SubListService'

const idLength = 12
const nanoid = customAlphabet(
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    idLength,
)

const baseTable = {
    id: char("id", { length: idLength }).$defaultFn(nanoid).primaryKey(),
}

export const users = pgTable('users', {
    ...baseTable,
    auauthId: uuid().unique().notNull(),
    name: text().unique().notNull(),
    fullName: text(),
})

export const lists = pgTable('lists', {
    ...baseTable,
    creatorId: text().references(() => users.id).notNull(),
    createdAt: timestamp({ mode: 'date', withTimezone: true }).notNull().defaultNow(),
    name: text().notNull(),
    origin: text().notNull(),
    size: integer().notNull(),
})

// all leads must have name and phone number, at least
export const leads = pgTable('leads', {
    ...baseTable,
    listId: text().references(() => lists.id).notNull(),
    subListId: text().references(() => subLists.id),
    name: text().notNull(),
    phoneNumber: text().notNull(),
    cpf: char({ length: 11 }),
    birthDate: date({ mode: 'string' }),
    state: char({ length: 2 }),
    extraInfo: jsonb(),
})

export const subListStatesEnum = pgEnum('sub_list_states', subListStates)

export const subLists = pgTable('sub_lists', {
    ...baseTable,
    parentListId: text().references(() => lists.id).notNull(),
    assigneeId: text().references(() => users.id),
    state: subListStatesEnum().notNull(),
})

export const interactionTypesEnum = pgEnum('interaction_types', interactionTypes)

export const interactionStatusesEnum = pgEnum('interaction_statuses', interactionStatuses)

export const leadInteractions = pgTable('lead_interactions', {
    ...baseTable,
    leadId: text().references(() => leads.id).notNull(),
    sellerId: text().references(() => users.id).notNull(),
    contactedAt: timestamp({ mode: 'date', withTimezone: true }).notNull(),
    interactionType: interactionTypesEnum().notNull(),
    status: interactionStatusesEnum().notNull(),
    notes: text(),
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