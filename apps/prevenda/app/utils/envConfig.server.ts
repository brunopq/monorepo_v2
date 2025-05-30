import dotenv from "dotenv"
import { cleanEnv, str, url } from "envalid"

dotenv.config()

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "production"],
  }),
  DB_URL: url(),
})
