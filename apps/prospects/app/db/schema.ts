import { char, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { customAlphabet } from 'nanoid'

const idLength = 12
const nanoid = customAlphabet(
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    idLength,
)

const baseTable = {
    id: char("id", { length: idLength }).$defaultFn(nanoid).primaryKey(),
}

export const users = pgTable('user', {
    ...baseTable,
    auauthId: uuid().unique().notNull(),
    name: text().unique().notNull(),
    fullName: text(),
})