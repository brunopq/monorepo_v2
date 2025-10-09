import type { Route } from "./+types/app_.admin.indicacoes"
import { useEffect, useState } from "react"
import { PencilIcon } from "lucide-react"
import { Form, useSearchParams } from "react-router"
import { Button, Dialog, Select, Table } from "iboti-ui"
import z from "zod"

import { getAdminOrRedirect } from "~/lib/authGuard"
import { maxWidth } from "~/lib/utils"
import { extractDateFromRequest } from "~/lib/extractDateFromRequest"

import IndicationService from "~/services/IndicationService"

import { useReferrers } from "~/hooks/data/useReferrers"
import { toast } from "~/hooks/use-toast"

import { AutocompleteInput } from "~/components/AutocompleteInput"

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { jwt } = await getAdminOrRedirect(request)

  const { year } = extractDateFromRequest(request)

  const indications = await IndicationService.getIndications(year)

  return { year, indications }
}

const actionBodySchema = z.object({
  oldName: z.string(),
  newName: z.string(),
})
export const action = async ({ request }: Route.ActionArgs) => {
  await getAdminOrRedirect(request)

  try {
    const { year } = extractDateFromRequest(request)

    const formData = await request.formData()
    const body = Object.fromEntries(formData.entries())

    const { oldName, newName } = actionBodySchema.parse(body)

    if (oldName === newName) {
      return {
        ok: false as const,
        message: "Os nomes são iguais",
      }
    }

    await IndicationService.renameIndications(oldName, newName)

    return {
      ok: true as const,
      data: {},
    }
  } catch (error) {
    console.error(error)
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}

const YEARS = [2024, 2025, 2026]

export default function Indicacoes({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { year, indications } = loaderData
  const [_, setSearchParams] = useSearchParams()

  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [referrerName, setReferrerName] = useState<string>()

  const { referrers, loading: referrersLoading } = useReferrers({
    includeUsers: true,
  })

  const handleOpenRenameDialog = (name: string) => {
    setReferrerName(name)
    setRenameDialogOpen(true)
  }

  const handleCloseRenameDialog = () => {
    setReferrerName(undefined)
    setRenameDialogOpen(false)
  }

  const setYear = (year: number) => {
    setSearchParams({ ano: String(year) })
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (actionData?.ok) {
      handleCloseRenameDialog()
      toast({
        title: "Indicações renomeadas com sucesso",
      })
    }
  }, [actionData])

  return (
    <>
      <Dialog.Root
        open={renameDialogOpen}
        onOpenChange={handleCloseRenameDialog}
      >
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Renomear indicação</Dialog.Title>
            <Dialog.Description>
              Utilize esse formulário para deduplicar ou corrigir o nome das
              indicações.
            </Dialog.Description>
          </Dialog.Header>

          <Form method="POST" className="space-y-1">
            <p>
              Renomear todas as indicações de{" "}
              <strong className="whitespace-nowrap font-semibold text-primary-700">
                {referrerName}
              </strong>{" "}
              para:
            </p>

            <input type="hidden" name="oldName" value={referrerName} />

            <AutocompleteInput
              placeholder="Nome"
              name="newName"
              disabled={referrersLoading}
              options={referrers?.map((r) => r.referrerName) || []}
            />

            <Dialog.Footer>
              <Dialog.Close asChild>
                <Button variant="ghost">Fechar</Button>
              </Dialog.Close>

              <Button type="submit">Renomear</Button>
            </Dialog.Footer>
          </Form>
        </Dialog.Content>
      </Dialog.Root>
      <section className={maxWidth("mt-8")}>
        <header className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-medium text-2xl">Indicações</h2>
        </header>

        <fieldset className="mb-4 flex items-end justify-start gap-6">
          <span className="min-w-max text-sm text-zinc-800">
            <p className="pb-1">Ano:</p>
            <Select.Root
              onValueChange={(v) => setYear(Number(v))}
              name="ano"
              defaultValue={`${year}`}
            >
              <Select.Trigger showIcon={false} className="w-fit text-sm">
                <Select.Value placeholder="Trocar ano" />
              </Select.Trigger>
              <Select.Content className="max-h-64">
                {YEARS.map((a) => (
                  <Select.Item key={a} value={`${a}`}>
                    {a}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </span>
        </fieldset>

        <main>
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head className="w-0" />
                <Table.Head>Nome</Table.Head>
                <Table.Head>Indicações</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {indications.map((indication, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                <Table.Row key={index}>
                  <Table.Cell>{index + 1}º</Table.Cell>
                  <Table.Cell className="group flex items-center gap-2">
                    <span>{indication.referrerName}</span>
                    <Button
                      className="-translate-x-1/4 scale-75 cursor-pointer opacity-0 transition hover:text-primary-700 group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100"
                      icon
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        handleOpenRenameDialog(indication.referrerName)
                      }
                    >
                      <PencilIcon className="size-4" />
                    </Button>
                  </Table.Cell>
                  <Table.Cell>{indication.totalIndications}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </main>
      </section>
    </>
  )
}
