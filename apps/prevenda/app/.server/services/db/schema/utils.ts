import { char, type PgColumnBuilderBase } from "drizzle-orm/pg-core"
import { customAlphabet } from "nanoid"

const idLength = 12
const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  idLength,
)

export const id = () => char({ length: idLength })

export const baseTable = {
  id: id().$defaultFn(nanoid).primaryKey(),
} satisfies Record<string, PgColumnBuilderBase>
