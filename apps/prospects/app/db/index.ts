import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

import { env } from "../utils/env"

import * as schema from "./schema"


const connection = {
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
}

const migration = postgres({ ...connection, max: 1 })
const sql = postgres({ ...connection })

const drizzleConfig = { schema, casing: 'snake_case' } as const

export const db = drizzle(sql, drizzleConfig)

await migrate(drizzle(migration, drizzleConfig), { migrationsFolder: "./drizzle" })
await migration.end()
