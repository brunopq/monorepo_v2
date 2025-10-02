import { useFetcher, useLocation, useNavigate } from "react-router"
import { Button, Dialog, toast } from "iboti-ui"
import { useEffect } from "react"

import type { action as listAction } from "../routes/lists/[id]"
import { Trash2Icon } from "lucide-react"

export type DeleteListConfirmationModalProps = {
  listId: string
  listName: string
}

export function DeleteListConfirmationModal({
  listId,
  listName,
}: DeleteListConfirmationModalProps) {
  const fetcher = useFetcher<typeof listAction>()
  const navigate = useNavigate()
  const location = useLocation()

  const handleDelete = () => {
    fetcher.submit(null, {
      method: "DELETE",
      action: `/listas/${listId}`,
    })
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    console.log(location.pathname)
    if (fetcher.data?.method !== "delete") return

    if (fetcher.data.ok) {
      toast({
        title: "Lista excluída",
        description: `A lista ${listName} foi excluída com sucesso.`,
      })

      if (location.pathname === `/listas/${listId}`) {
        navigate("/")
      }
    }
  }, [fetcher.data])

  return (
    <Dialog.Root>
      <Dialog.Trigger className="flex items-center justify-between gap-2">
        <Trash2Icon className="size-4" />
        Excluir
      </Dialog.Trigger>

      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Excluir lista {listName}</Dialog.Title>
        </Dialog.Header>

        <p>
          Você tem certeza que quer excluir a lista{" "}
          <strong className="font-semibold text-primary-700">{listName}</strong>
          ?
        </p>
        <p>
          Essa ação vai excluir todas as listinhas e leads atribuidos a ela.
        </p>

        <Dialog.Footer>
          <Dialog.Close asChild>
            <Button variant="outline">Cancelar</Button>
          </Dialog.Close>

          <Button onClick={handleDelete} variant="destructive" type="submit">
            Excluir lista
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  )
}
