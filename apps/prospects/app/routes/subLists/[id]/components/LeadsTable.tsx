import { useLoaderData } from "react-router"
import { Table } from "iboti-ui"

import type { CompleteDomainLead } from "~/services/LeadService"

import type { loader } from ".."
import { LeadRow } from "./LeadRow"

export type LeadsTableProps = {
  leads: CompleteDomainLead[]
  headers: string[]
  isActive: boolean
}

export function LeadsTable({ headers, leads, isActive }: LeadsTableProps) {
  const { canEdit } = useLoaderData<typeof loader>()

  return (
    <div className="sticky left-0 overflow-auto">
      {!canEdit && (
        <div className="sticky left-0 mb-4 rounded-md border border-orange-300 bg-orange-50 p-3">
          <p className="text-orange-800 text-sm">
            Você não pode editar esta listinha pois ela está atribuída a outro
            usuário.
          </p>
        </div>
      )}

      <Table.Root className="space-y-2">
        <Table.Header>
          <Table.Row>
            <Table.Head className="sticky top-0 z-10 bg-zinc-50/50 backdrop-blur-2xl">
              {/* Empty header for buttons */}
            </Table.Head>
            {headers.map((h) => (
              <Table.Head
                className="sticky top-0 z-10 bg-zinc-50/50 backdrop-blur-2xl"
                key={h}
              >
                {h}
              </Table.Head>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {leads.map((lead) => (
            <LeadRow
              key={lead.id}
              isActive={isActive}
              headers={headers}
              lead={lead}
            />
          ))}
        </Table.Body>
      </Table.Root>
    </div>
  )
}
