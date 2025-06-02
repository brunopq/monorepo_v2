import { defineConfig } from "drizzle-kit"

import { env } from "~/utils/envConfig.server"

export default defineConfig({
  schema: "./app/.server/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: env.DB_URL,
  },
})
