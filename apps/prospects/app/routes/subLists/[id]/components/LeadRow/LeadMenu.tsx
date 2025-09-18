import { Button, Table } from "iboti-ui"
import { useLoaderData } from "react-router"
import { useState } from "react"

import type { CompleteDomainLead } from "~/services/LeadService"

import type { loader } from "../.."
import { NewInteractionForm } from "./NewInteractionForm"
import { LeadInteractionRow } from "./LeadInteractionRow"
import { ReminderCard } from "./ReminderCard"

export type LeadMenuProps = {
  lead: CompleteDomainLead
}

export function LeadMenu({ lead }: LeadMenuProps) {
  const { canEdit } = useLoaderData<typeof loader>()

  const [open, setOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)

  return (
    <Table.Row
      data-open={open}
      className="hidden transition-colors data-[open=true]:table-row data-[open=true]:bg-zinc-100"
    >
      <Table.Cell colSpan={9999} className="p-0">
        <div className="sticky left-0 w-[calc(100vw-2rem-1px)] p-4">
          <section>
            <header className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-lg text-primary-800">
                Interações
              </h3>

              {canEdit && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowForm(!showForm)}
                  className="ml-2"
                >
                  {showForm ? "Fechar formulário" : "Registrar nova interação"}
                </Button>
              )}
            </header>

            {showForm && canEdit && (
              <NewInteractionForm
                leadId={lead.id}
                onClose={() => setShowForm(false)}
              />
            )}

            <div className="space-y-2">
              {lead.interactions.length > 0 ? (
                lead.interactions.map((interaction) => (
                  <LeadInteractionRow
                    key={interaction.id}
                    interaction={interaction}
                    leadId={lead.id}
                    sellerName={interaction.sellerId}
                  />
                ))
              ) : (
                <p>Nenhuma interação registrada.</p>
              )}
            </div>
          </section>

          {lead.reminders.length > 0 && (
            <section>
              <header className="mt-4 mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-lg text-primary-800">
                  Lembretes
                </h3>
              </header>
              {lead.reminders.map((r) => (
                <ReminderCard key={r.id} reminder={r} />
              ))}
            </section>
          )}
        </div>
      </Table.Cell>
    </Table.Row>
  )
}
