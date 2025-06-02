import { getUserOrRedirect } from "~/.server/cookies/authSession"
import type { Route } from "./+types/templates"
import { Form, Link, redirect } from "react-router"

import type { Template } from "~/.server/db/schema/template"
import TemplateService from "~/.server/services/TemplateService"

import { Button } from "~/components/ui/button"

export function meta() {
  return [{ title: "" }]
}

export async function loader({ request }: Route.LoaderArgs) {
  await getUserOrRedirect(request, { redirectPath: "/", roles: ["ADMIN"] })

  return await TemplateService.listTemplates()
}

export async function action({ request }: Route.ActionArgs) {
  await getUserOrRedirect(request, { redirectPath: "/", roles: ["ADMIN"] })

  const createdTemplate = await TemplateService.createTemplate({
    name: "Novo template",
    description: "Detalhes sobre o template",
  })

  return redirect(`edit/${createdTemplate.id}`)
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <header className="mb-8 flex items-center justify-between">
        <h1 className="font-semibold text-2xl">
          Templates ({loaderData.length})
        </h1>

        <Form method="POST">
          <Button type="submit">Novo template</Button>
        </Form>
      </header>

      <div className="flex flex-wrap gap-4">
        {loaderData.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </>
  )
}

type TemplateProps = {
  template: Template & {
    fieldCount: number
    submissionCount: number
  }
}

function TemplateCard({ template }: TemplateProps) {
  return (
    <div className="min-w-lg border p-4 dark:border-zinc-500">
      <header className="flex items-center justify-between gap-2">
        <div>
          <span className="flex w-fit items-center justify-between gap-4 ">
            <h2 className="font-semibold text-lg">{template.name}</h2>
            <Link
              className="rounded-lg px-1.5 font-semibold text-sm transition-colors dark:bg-primary-400/25 dark:text-primary-100 dark:hover:bg-primary-300/40 dark:hover:text-primary-50"
              to={`edit/${template.id}`}
            >
              Editar
            </Link>
          </span>
          <p>{template.description}</p>
        </div>
        <div>
          <p>Campos: {template.fieldCount}</p>
          <p>Respostas: {template.submissionCount}</p>
        </div>
      </header>

      <hr className="my-2 dark:border-zinc-500" />
    </div>
  )
}
