import { Button, Dialog, Input } from "iboti-ui"
import { useFetcher } from "react-router"
import { EyeIcon, EyeOffIcon, SparklesIcon } from "lucide-react"
import { memo, useCallback, useEffect, useState } from "react"

import type { action as aiRenameAction } from "~/routes/api/prettifyColumns"

import type { FieldMapping, ProcessedFile } from "../types"
import { cn } from "~/utils/styling"

type FieldsMappingModalProps = {
  file: ProcessedFile
  /**
   * The function that should be called to update the file's mappings,
   * submitting the local mappings
   */
  onUpdateMappings: (mappings: FieldMapping[]) => void
}

export function FieldsMappingModal({
  file,
  onUpdateMappings,
}: FieldsMappingModalProps) {
  const [localMappings, setLocalMappings] = useState<FieldMapping[]>(
    file.mappings,
  )

  const handleSetName = useCallback((fieldId: string, newName: string) => {
    setLocalMappings((prev) =>
      prev.map((mapping) =>
        mapping.id === fieldId ? { ...mapping, name: newName } : mapping,
      ),
    )
  }, [])

  const handleToggleVisibility = useCallback((fieldId: string) => {
    setLocalMappings((prev) =>
      prev.map((mapping) =>
        mapping.id === fieldId
          ? { ...mapping, visible: !mapping.visible }
          : mapping,
      ),
    )
  }, [])

  const handleUpdateMappings = useCallback(() => {
    onUpdateMappings(localMappings)
  }, [localMappings, onUpdateMappings])

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button size="sm" variant="outline">
          Ver colunas
        </Button>
      </Dialog.Trigger>

      <Dialog.Content className="[--dialog-content-max-width:_38rem]">
        <Dialog.Header>
          <Dialog.Title>Colunas do arquivo {file.file.name}</Dialog.Title>
        </Dialog.Header>

        <div className="space-y-4">
          {/* <FieldsList fields={file.headers} /> */}

          <div>
            <h3 className="mb-2 font-medium text-sm text-zinc-700">
              Mapeamentos:
            </h3>

            <div className="w-full overflow-hidden rounded-md border border-zinc-300 bg-zinc-100 text-sm text-zinc-700">
              <table className="w-full">
                <thead>
                  <tr className="bg-primary-50 font-semibold text-zinc-800">
                    <th className="w-0 px-2 py-1">{/* visibility toggle */}</th>
                    <th className="w-0 px-2 py-1 text-left">Coluna</th>
                    <th className="px-2 py-1 text-left">Campo</th>
                  </tr>
                </thead>
                <tbody>
                  {localMappings.map((m) => (
                    <AIMapping
                      key={m.id}
                      mapping={m}
                      handleSetName={handleSetName}
                      handleToggleVisibility={handleToggleVisibility}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Dialog.Close asChild>
            <Button variant="outline">Cancelar</Button>
          </Dialog.Close>
          <Dialog.Close asChild>
            <Button onClick={handleUpdateMappings}>Salvar</Button>
          </Dialog.Close>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  )
}

type AIMappingProps = {
  mapping: FieldMapping
  handleSetName: (fieldId: string, newName: string) => void
  handleToggleVisibility: (fieldId: string) => void
}

const AIMapping = memo(
  ({ mapping, handleSetName, handleToggleVisibility }: AIMappingProps) => {
    const aiRenameFetcher = useFetcher<typeof aiRenameAction>({
      key: mapping.id,
    })

    console.log(`Rendering mapping: ${mapping.field} -> ${mapping.name}`)

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
      const data = aiRenameFetcher.data

      if (!data) return

      if (data.error) {
        // handle error (e.g., show a toast)
        return
      }

      if (data.pretty && mapping) {
        handleSetName(mapping.id, data.pretty)
      }
    }, [aiRenameFetcher.data])

    if (!mapping) return null

    return (
      <tr
        data-visible={mapping.visible}
        className="border-zinc-200 border-b transition-opacity duration-75 data-[visible=false]:opacity-50"
      >
        <td className="px-2 py-1 align-middle">
          <button
            type="button"
            onClick={() => handleToggleVisibility(mapping.id)}
            title={mapping.visible ? "Ocultar campo" : "Mostrar campo"}
            className="cursor-pointer"
          >
            {mapping.visible ? (
              <EyeIcon className="size-5" />
            ) : (
              <EyeOffIcon className="size-5" />
            )}
          </button>
        </td>
        <td className="whitespace-nowrap px-2 py-1 align-middle">
          <span>{mapping.field}</span>
        </td>
        <td className="px-2 py-1 align-middle">
          <span className="flex items-center justify-between gap-1">
            <span
              className={cn(
                aiRenameFetcher.state !== "idle" && "animate-pulse",
              )}
            >
              <Input
                className="px-2 py-1 text-sm"
                value={mapping.name}
                onChange={(e) => handleSetName(mapping.id, e.target.value)}
                disabled={!mapping.visible}
              />
            </span>

            <aiRenameFetcher.Form method="POST" action="/api/prettify-column">
              <button
                type="submit"
                name="column"
                value={mapping.field}
                title="Melhorar nome com IA"
                className="group cursor-pointer rounded-full bg-emerald-300/15 p-1.5 transition-colors hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-emerald-300/15"
                disabled={!mapping.visible}
              >
                <SparklesIcon className="size-4 stroke-[1.6] text-emerald-800 transition group-hover:rotate-12 group-hover:text-emerald-900" />
              </button>
            </aiRenameFetcher.Form>
          </span>
        </td>
      </tr>
    )
  },
)
