import type { Route } from "./+types"
import { redirect } from "react-router"

import TemplateService from "~/.server/services/TemplateService"

export async function loader({ params }: Route.LoaderArgs) {
  const templateId = params.id

  const template = await TemplateService.getTemplate(templateId)

  if (!template) throw redirect("/templates")

  return { template }
}
