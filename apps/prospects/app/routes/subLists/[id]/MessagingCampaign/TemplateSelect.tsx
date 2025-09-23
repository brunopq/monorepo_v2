import { Checkbox } from "iboti-ui"
import { useState } from "react"

import { useMessageTemplates } from "~/hooks/useMessageTemplates"
import { useCreateCampaignContext } from "./context"


export function TemplateSelect() {
  const { dialogOpen, onSelectTemplate } = useCreateCampaignContext()

  const { templates, isLoading } = useMessageTemplates(dialogOpen)

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  )

  const handleSelectTemplate = (templateId: string) => {
    const template = templates?.find((t) => t.id === templateId)
    if (template) {
      setSelectedTemplateId(templateId)
      onSelectTemplate(template)
    }
  }

  return (
    <>
      <p className="mb-2">
        Selecione o template {templates && `(${templates.length} disponíveis):`}
      </p>
      {isLoading && <p>Carregando templates...</p>}
      {!isLoading && templates && (
        <ul className="max-h-[24rem] space-y-2 overflow-y-auto">
          {templates.map((t) => (
            // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
            <li
              key={t.id}
              data-selected={t.id === selectedTemplateId}
              onClick={() => handleSelectTemplate(t.id)}
              className="group border-primary-500 border-l-[3px] px-2 transition-colors hover:bg-zinc-100/50 data-[selected=true]:border-primary-400 data-[selected=true]:bg-zinc-50"
            >
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 font-medium text-primary-800 transition-colors group-data-[selected=true]:text-primary-600">
                  <Checkbox checked={t.id === selectedTemplateId} />
                  {t.name}
                </label>

                <span className="rounded-full bg-primary-200 px-2 py-0.5 text-primary-800 text-xs">
                  {t.category}
                </span>
              </div>

              {t.parameterNames.length > 0 && (
                <div className="my-1 flex gap-1">
                  {t.parameterNames.map((p) => (
                    <span
                      className="rounded-sm bg-accent-300 px-2 py-0.5 font-medium text-accent-900 text-sm"
                      key={p}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}
              <p className="whitespace-pre-wrap text-sm text-zinc-700">
                {t.content}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
