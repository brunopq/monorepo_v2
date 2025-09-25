import dotenv from "dotenv"
import { cleanEnv, host, port, str, url } from "envalid"

dotenv.config()

export const env = cleanEnv(process.env, {
    NODE_ENV: str({
        choices: ["development", "production", "test"],
    }),
    DB_HOST: host(),
    DB_USER: str(),
    DB_PASSWORD: str(),
    DB_NAME: str(),
    DB_PORT: port(),

    RABBITMQ_URL: url(),

    COOKIE_SECRET: str(),
    AUTH_SERVICE_URL: url(),

    META_WABA_ID: str(),
    META_PHONE_NUMBER_ID: str(),
    META_API_TOKEN: str(),
    META_GRAPH_API_URL: str(),
})
