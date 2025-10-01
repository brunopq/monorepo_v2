import { useCreateCampaignContext } from "./context"

export function ConfirmationStep() {
  const { leadsCount, messagesCount, selectedTemplate } =
    useCreateCampaignContext()

  return (
    <div>
      <p className="mb-2">Confirmar criação</p>

      <div>
        Serão enviadas
        <strong className="font-semibold text-primary-700">
          {" "}
          {messagesCount}{" "}
        </strong>
        mensagens para
        <strong className="font-semibold text-primary-700">
          {" "}
          {leadsCount}{" "}
        </strong>
        leads, utilizando o template{" "}
        <strong className="font-semibold text-primary-700">
          {selectedTemplate?.name}
        </strong>
        .
      </div>
    </div>
  )
}
