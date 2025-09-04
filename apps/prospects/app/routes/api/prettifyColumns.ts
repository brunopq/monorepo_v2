import type { Route } from "./+types/prettifyColumns"

import { prettifyColumn } from "~/services/ai"

export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData()
    const column = formData.get("column")

    if (typeof column !== "string" || !column.trim()) {
        return { error: "Missing column" }
    }

    const pretty = await prettifyColumn(column)

    return { pretty }
}
