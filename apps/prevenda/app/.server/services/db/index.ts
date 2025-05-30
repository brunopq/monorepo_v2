import { drizzle } from "drizzle-orm/bun-sql"
// import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/bun-sql/migrator"
import { SQL } from "bun"
// import postgres from "postgres"

import { env } from "~/utils/envConfig.server"

import * as schema from "./schema"

const migration = new SQL(env.DB_URL)
const sql = new SQL(env.DB_URL)
// const migration = postgres(env.DB_URL)
// const sql = postgres(env.DB_URL)

export const db = drizzle(sql, { schema, casing: "snake_case" })

await migrate(drizzle(migration, { schema, casing: "snake_case" }), {
  migrationsFolder: "./drizzle",
})
await migration.end()
