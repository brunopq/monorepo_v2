import type { Route } from "./+types/app_.admin.indicacoes"
import { useSearchParams } from "react-router"
import { Select } from "iboti-ui"

import { getAdminOrRedirect } from "~/lib/authGuard"
import { maxWidth } from "~/lib/utils"
import { extractDateFromRequest } from "~/lib/extractDateFromRequest"

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { jwt } = await getAdminOrRedirect(request)

  const { year } = extractDateFromRequest(request)

  return { year }
}

const YEARS = [2024, 2025, 2026]

export default function Indicacoes({ loaderData }: Route.ComponentProps) {
  const { year } = loaderData

  const [_, setSearchParams] = useSearchParams()

  const setYear = (year: number) => {
    setSearchParams({ ano: String(year) })
  }

  return (
    <section className={maxWidth("mt-8")}>
      <header className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-medium text-2xl">Indicações</h2>
      </header>

      <fieldset className="mb-4 flex items-end justify-start gap-6">
        <span className="min-w-max text-sm text-zinc-800">
          <p>Ano:</p>
          <Select.Root
            onValueChange={(v) => setYear(Number(v))}
            name="ano"
            defaultValue={`${year}`}
          >
            <Select.Trigger
              size="sm"
              showIcon={false}
              className="w-fit py-1.5 text-sm"
            >
              <Select.Value placeholder="Trocar ano" />
            </Select.Trigger>
            <Select.Content size="sm" className="max-h-64">
              {YEARS.map((a) => (
                <Select.Item key={a} value={`${a}`}>
                  {a}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </span>
      </fieldset>
    </section>
  )
}
