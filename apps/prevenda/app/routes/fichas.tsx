import { Form, Link, redirect } from "react-router"
import type { Route } from "./+types/fichas"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { getToken, getUserOrRedirect } from "~/.server/cookies/authSession"
import TemplateService from "~/.server/services/TemplateService"
import SubmissionService from "~/.server/services/SubmissionService"

import { Button } from "~/components/ui/button"
import { Badge, SubmissionStateBadge } from "~/components/ui/badge"

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserOrRedirect(request)
  // biome-ignore lint/style/noNonNullAssertion: get user or redirect will throw if user is not found
  const token = (await getToken(request))!

  const templates = await TemplateService.listTemplates()
  const userSubmissions = await SubmissionService.listByUser(user.id, token)

  return {
    templates,
    userSubmissions,
  }
}

export async function action({ request }: Route.ActionArgs) {
  const user = await getUserOrRedirect(request)

  const formData = await request.formData()
  const templateId = formData.get("templateId")

  if (!templateId || typeof templateId !== "string") {
    return redirect("/fichas")
  }

  const createdSumission = await SubmissionService.create({
    templateId,
    submitterId: user.id,
  })

  return redirect(`edit/${createdSumission.id}`)
}

export default function Fichas({ loaderData }: Route.ComponentProps) {
  const { templates, userSubmissions } = loaderData

  return (
    <div>
      <section>
        <header className="mb-8 flex items-center justify-between">
          <h2 className="font-semibold font-serif text-2xl text-primary-100">
            Templates disponíveis ({templates.length})
          </h2>
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
          <h2 className="font-semibold font-serif text-2xl text-primary-100">
            Suas fichas:
          </h2>
        </header>

        <ul className="space-y-6">
          {userSubmissions.map((submission) => (
            <li
              key={submission.id}
              className="grid grid-cols-[1fr_auto] gap-4 rounded-sm border border-zinc-50 bg-zinc-50/50 p-1 pl-3 shadow dark:border-zinc-800 dark:bg-zinc-800/25"
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
                <p>
                  <strong className="font-semibold text-zinc-300/85">
                    Última edição:{" "}
                  </strong>
                  {format(submission.createdAt, "dd 'de' MMMM, yyyy", {
                    locale: ptBR,
                  })}
                </p>
                <p>
                  <strong className="font-semibold text-zinc-300/85">
                    Status:{" "}
                  </strong>
                  <SubmissionStateBadge state={submission.state} />
                </p>
              </span>

              <div className="grid grid-rows-3 gap-1">
                <Button variant="secondary" size="sm" asChild>
                  <Link to={{ pathname: submission.id, search: "?mode=view" }}>
                    Visualizar
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to={{ pathname: submission.id, search: "?mode=edit" }}>
                    Continuar preenchendo
                  </Link>
                </Button>
                <Button size="sm">Enviar para revisão</Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
