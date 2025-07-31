import { char, date, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { customAlphabet } from 'nanoid'

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
    createdBy: text().references(() => users.id).notNull(),
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

export const subLists = pgTable('sub_lists', {
    ...baseTable,
    parentListId: text().references(() => lists.id).notNull(),
    assigneeId: text().references(() => users.id)
})

export const interactionTypes = pgEnum('interaction_types', [
    'whatsapp_message',
    'whatsapp_call',
    'call',
    'email',
    'other' // I have no idea what that might be
])

export const interactionStatuses = pgEnum('interaction_statuses', [
    'waiting_response',
    'no_response',
    'wrong_person',
    'no_interest',
    'has_interest',
    'not_reachable',
    'not_interested',
    'interested',
    'converted', // lead converted to customer
    'lost' // lead lost
])

export const leadInteractions = pgTable('lead_interactions', {
    ...baseTable,
    leadId: text().references(() => leads.id).notNull(),
    sellerId: text().references(() => users.id).notNull(),
    contactedAt: timestamp({ mode: 'date', withTimezone: true }).notNull(),
    interactionType: interactionTypes().notNull(),
    status: interactionStatuses().notNull(),
    notes: text(),
})