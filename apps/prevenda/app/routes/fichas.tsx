import { Form, Link, redirect } from "react-router"
import type { Route } from "./+types/fichas"

import TemplateService from "~/.server/services/TemplateService"
import SubmissionService from "~/.server/services/SubmissionService"

import { Button } from "~/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export async function loader({ request }: Route.LoaderArgs) {
  const templates = await TemplateService.listTemplates()
  const userSubmissions = await SubmissionService.listByUser("123")

  return {
    templates,
    userSubmissions,
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const templateId = formData.get("templateId")

  if (!templateId || typeof templateId !== "string") {
    return redirect("/fichas")
  }

  const createdSumission = await SubmissionService.create({
    templateId,
    submitterId: "123",
  })

  return redirect(`edit/${createdSumission.id}`)
}

export default function Fichas({ loaderData }: Route.ComponentProps) {
  const { templates, userSubmissions } = loaderData

  return (
    <div>
      <section>
        <header className="mb-8 flex items-center justify-between">
          <h1 className="font-semibold text-2xl">
            Templates disponíveis ({templates.length})
          </h1>
        </header>
        <ul className="space-y-6">
          {templates.map((template) => (
            <li className="grid grid-cols-[1fr_auto]" key={template.id}>
              <h3 className="font-semibold text-xl ">{template.name}</h3>
              <span>{template.description || "Sem descrição..."}</span>

              <Form
                className="col-start-2 row-span-2 row-start-1"
                method="POST"
              >
                <Button name="templateId" value={template.id} type="submit">
                  Preencher
                </Button>
              </Form>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="font-semibold text-2xl">Suas fichas:</h1>
        </header>

        <ul className="space-y-6">
          {userSubmissions.map((submission) => (
            <li
              key={submission.id}
              className="grid grid-cols-[1fr_auto] items-center"
            >
              <span>
                <p>
                  <strong className="font-semibold text-zinc-300/85">
                    Template:{" "}
                  </strong>
                  {submission.template.name}
                </p>
                <p>
                  <strong className="font-semibold text-zinc-300/85">
                    Criado em:{" "}
                  </strong>
                  {format(submission.createdAt, "dd 'de' MMMM, yyyy", {
                    locale: ptBR,
                  })}
                </p>
              </span>

              <Button asChild>
                <Link to={`edit/${submission.id}`}>Continuar preenchendo</Link>
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
