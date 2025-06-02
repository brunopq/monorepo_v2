import { format } from "date-fns"
import type { Route } from "./+types/home"
import { data, Form, Link, useLoaderData } from "react-router"

import {
  destroySession,
  getSession,
  getToken,
  getUserOrRedirect,
} from "~/.server/cookies/authSession"
import SubmissionService, {
  type FullSubmission,
} from "~/.server/services/SubmissionService"

import { Button } from "~/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar"
import { cn } from "~/utils/classes"
import { Badge, SubmissionStateBadge } from "~/components/ui/badge"

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserOrRedirect(request)
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  const token = (await getToken(request))!
  const submissions = await SubmissionService.list(token)

  return {
    user,
    submissions,
  }
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request)

  return data({}, { headers: { "Set-Cookie": await destroySession(session) } })
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData

  return (
    <>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Páginas</SidebarGroupLabel>
          <ul>
            <li>
              <Link
                className="text-primary-50 underline-offset-2 transition-colors hover:text-primary-200 hover:underline"
                to="/"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                className="text-primary-50 underline-offset-2 transition-colors hover:text-primary-200 hover:underline"
                to="/templates"
              >
                Templates
              </Link>
            </li>
            <li>
              <Link
                className="text-primary-50 underline-offset-2 transition-colors hover:text-primary-200 hover:underline"
                to="/fichas"
              >
                Fichas
              </Link>
            </li>
          </ul>
        </SidebarGroup>
      </SidebarContent>

      <header className="mb-6 flex items-center justify-between gap-2 border-zinc-400 border-b pb-4 dark:border-zinc-700">
        <SidebarTrigger />
        <div>
          <h1 className="font-semibold font-serif text-2xl text-primary-900 dark:text-primary-100">
            Super sistema de gerenciamento de vendas incrível
          </h1>

          <span className="w-full">Conta atual: {user.name}</span>
        </div>

        <Form method="DELETE">
          <Button size="sm" variant="destructive">
            Sair
          </Button>
        </Form>
      </header>

      {user.role === "ADMIN" ? (
        <AdminSubmissionsView />
      ) : (
        <SellerSubmissionsView />
      )}
    </>
  )
}

function AdminSubmissionsView() {
  const { submissions } = useLoaderData<typeof loader>()

  return (
    <div>
      <h2 className="mb-4 font-normal font-serif dark:text-zinc-300">
        Visão geral das fichas preenchidas:
      </h2>

      <main>
        <SubmissionsBoard />
      </main>

    </div>
  )
}

function SubmissionsBoard() {
  const { submissions } = useLoaderData<typeof loader>()

  const draft = submissions.filter(s => s.state === 'draft')
  const waitingReview = submissions.filter(s => s.state === 'waiting_review')
  const changesRequested = submissions.filter(s => s.state === 'changes_requested')
  const approved = submissions.filter(s => s.state === 'approved')

  return (
    <div className="flex overflow-x-auto gap-4">
      <SubmissionBoardSection color="red" name="Rascunhos" submissions={draft} />

      <SubmissionBoardSection color="blue" name="Aguardando Revisão" submissions={waitingReview} />

      <SubmissionBoardSection color="yellow" name="Esperando Alterações" submissions={changesRequested} />

      <SubmissionBoardSection color="green" name="Aprovado" submissions={approved} />
    </div>
  )
}

type SubmissionBoardSectionProps = {
  name: string
  color: string
  submissions: FullSubmission[]
}

function SubmissionBoardSection({ name, color, submissions }: SubmissionBoardSectionProps) {
  return (
    <section className="min-w-sm shadow-lg bg-zinc-950/25 rounded-md grow">
      <header
        className="p-1">
        <h3 className="font-semibold text-zinc-300 font-serif">{name}</h3>
      </header>

      <hr className="border-zinc-800 mx-1" />

      <div className="p-1">
        {submissions.map(s => (
          <SubmissionCard key={s.id} submission={s} />
        ))}
      </div>
    </section>
  )
}


function SellerSubmissionsView() {
  return <div>Seller submissions</div>
}

type SubmissionCardProps = { submission: FullSubmission }

function SubmissionCard({ submission }: SubmissionCardProps) {
  return (
    <div className="rounded-sm border border-zinc-50 bg-zinc-50/50 p-1 pb-2 shadow dark:border-zinc-800 dark:bg-zinc-800/25">
      <header className="mb-2 flex items-center gap-2 border-zinc-300 border-b pb-1 dark:border-zinc-800">
        <div className="flex flex-wrap gap-2">
          <Badge>{submission.template.name}</Badge>
          <SubmissionStateBadge state={submission.state} />
          {submission.submitter ? (
            <div className="text-sm">
              <span className="text-zinc-700 dark:text-zinc-300">
                Preenchido por: <strong>{submission.submitter.name}</strong> em{" "}
                <strong>{format(submission.createdAt, "dd/MM/yyyy")}</strong>
              </span>
            </div>
          ) : (
            <div>Usuário excluido</div>
          )}
        </div>

        <span className="flex flex-1 justify-end gap-1">
          <Button asChild size="sm" variant="secondary">
            <Link to={{
              pathname: `/fichas/${submission.id}`,
              search: 'mode=view'
            }}>
              Ver ficha
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to={{
              pathname: `/fichas/${submission.id}`,
              search: 'mode=review'
            }}>
              Revisar
            </Link>
          </Button>
        </span>
      </header>

      <ul className="px-2">
        {submission.submittedFields.map((field) => (
          <li key={field.templateFieldId}>
            <strong className="text-zinc-700 dark:text-zinc-300/90">
              {field.templateField.name}:{" "}
            </strong>
            {field.textValue ||
              field.numberValue ||
              (field.dateValue && format(field.dateValue, "dd/MM/yyyy")) ||
              field.checkboxValue?.toString() ||
              field.textareaValue}
          </li>
        ))}
      </ul>
    </div>
  )
}
