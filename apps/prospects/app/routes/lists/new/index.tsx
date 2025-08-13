import type { Route } from "./+types"
import { Link, useFetcher } from "react-router"
import { Fragment, useEffect, useRef, useState } from "react"
import { FileUpIcon, FileIcon, ArrowLeftIcon, ChevronDown } from "lucide-react"
import { Button, Dialog, Input, toast } from "iboti-ui"
import { z } from "zod/v4"

import ListService from "~/services/ListService"
import type { NewDomainLead } from "~/services/LeadService"
import LeadService from "~/services/LeadService"

import { getUserOrRedirect } from "~/utils/authGuard"
import { cn, maxWidth } from "~/utils/styling"

import {
  countLeadsInFile,
  extractLeadsFromFile,
  getFileHeaders,
} from "./fileUtils"
import { FieldsMappingModal } from "./FieldsMappingModal"
import type { FieldMapping, ProcessedFile } from "./types"
import { defaultFields, requiredFields } from "./constants"

export async function loader({ request }: Route.LoaderArgs) {
  await getUserOrRedirect(request)
  return null
}

const newListSchema = z.object({
  name: z.string().nonempty("Nome é obrigatório"),
  origin: z.string().nonempty("Origem é obrigatória"),
  leads: z.array(
    z.object({
      name: z.string().nonempty("Nome é obrigatório"),
      phoneNumber: z.string().nonempty("Telefone é obrigatório"),
      cpf: z.string().nullable(),
      birthDate: z.iso.date().nullable(),
      state: z.string().nullable(),
      extra: z.record(z.string(), z.string()).nullable(),
    }),
  ),
})

export async function action({ request }: Route.ActionArgs) {
  const user = await getUserOrRedirect(request)
  if (request.headers.get("content-type") !== "application/json") {
    throw new Response("Only application/json is supported", { status: 415 })
  }

  const body = await request.json()
  const { success, data, error } = newListSchema.safeParse(body)

  if (!success) {
    return new Response(
      JSON.stringify({
        error: "Dados inválidos",
        issues: error.issues,
      }),
      { status: 400 },
    )
  }

  const list = await ListService.create({
    createdBy: user,
    name: data.name,
    origin: data.origin,
    size: data.leads.length,
  })

  const leads = await LeadService.createMany(
    data.leads.map((l) => ({ ...l, listId: list.id })),
  )
}

export default function NewList({ actionData }: Route.ComponentProps) {
  const fetcher = useFetcher()

  const [listName, setListName] = useState("")
  const [origin, setOrigin] = useState("")
  const [files, setFiles] = useState<ProcessedFile[]>([])

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListName(event.target.value)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const leads: NewDomainLead[] = []

    for (const file of files) {
      console.log(file)
      if (
        !requiredFields.every((field) =>
          file.mappings.find((m) => m.name === field && m.field),
        )
      ) {
        toast({
          title: `O arquivo "${file.file.name}" deve conter os campos obrigatórios: ${requiredFields.join(
            ", ",
          )}`,
        })
        return
      }

      for (const { name, field } of file.mappings) {
        if (!field) {
          toast({
            title: `O campo "${name}" não está mapeado no arquivo "${file.file.name}". Remova o campo ou mapeie-o corretamente.`,
          })
          return
        }

        if (!file.headers.includes(field)) {
          toast({
            title: `O campo "${name}" está mapeado para "${field}", que não existe no arquivo "${file.file.name}".`,
          })
          return
        }
      }

      const result = await extractLeadsFromFile(file.file, file.mappings)
      console.log(result.leads)
      console.log(result.errors)

      if (result.errors.length > 0) {
        toast({
          title: `${result.errors.length} erros ao processar o arquivo "${file.file.name}"`,
          description: result.errors
            .map((e) => `Linha ${e.line}: ${e.message}`)
            .join("\n"),
        })
        // TODO: "você deseja continuar mesmo assim?"
        // For now, just return and don't submit the form
        return
      }

      leads.push(...result.leads)
    }

    const payload = {
      name: listName,
      origin: origin,
      leads: leads.map((l) => ({
        ...l,
      })),
    }

    console.log(payload)
    fetcher.submit(payload, {
      encType: "application/json",
      method: "post",
    })
  }

  return (
    <div className={maxWidth("pt-4")}>
      <fetcher.Form method="post" className="space-y-4" onSubmit={handleSubmit}>
        <header className="mb-4 flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link to="..">
              <ArrowLeftIcon />
            </Link>
          </Button>

          <h1 className="font-semibold text-2xl text-primary-700">
            Nova lista
          </h1>

          <CreationDialog name={listName} origin={origin} files={files} />
        </header>

        <div className="flex gap-2">
          <label className="flex-1 font-medium text-sm text-zinc-600">
            Nome da lista
            <Input
              type="text"
              id="name"
              name="name"
              value={listName}
              onChange={handleNameChange}
              placeholder="Ex: Demitidos 2025 Vivo"
              required
            />
          </label>
          <label className="flex-1 font-medium text-sm text-zinc-600">
            Origem
            <Input
              type="text"
              id="origin"
              name="origin"
              placeholder="Ex: LinkedIn, Site, etc."
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              required
            />
          </label>
        </div>

        <FilesInput
          files={files}
          setFiles={setFiles}
          listName={listName}
          setListName={setListName}
        />
      </fetcher.Form>
    </div>
  )
}

// 100% not AI slop I swear
// more like 90%
type FilesInputProps = {
  listName: string
  setListName: (name: string) => void
  files: ProcessedFile[]
  setFiles: (
    files: ProcessedFile[] | ((prev: ProcessedFile[]) => ProcessedFile[]),
  ) => void
}

function FilesInput({
  listName,
  setListName,
  files,
  setFiles,
}: FilesInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileErrors, setFileErrors] = useState<string[]>([])

  const generateFileKey = (file: File) => `${file.name}-${file.lastModified}`

  const isValidType = (file: File) => {
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]
    const allowedExtensions = [".csv", ".xls", ".xlsx"]

    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf("."))

    return (
      allowedTypes.includes(file.type) ||
      allowedExtensions.includes(fileExtension)
    )
  }

  // if this throws, the file is not valid
  const validateFile = (file: File) => {
    if (!isValidType(file)) {
      throw new Error("Apenas arquivos CSV, XLS ou XLSX são permitidos")
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error("O arquivo deve ter no máximo 10MB")
    }

    const fileKey = generateFileKey(file)
    const isDuplicate = files.some((f) => generateFileKey(f.file) === fileKey)

    if (isDuplicate) {
      throw new Error("Arquivo já foi adicionado")
    }
  }

  const generateDefaultMappings = (headers: string[]): FieldMapping[] => {
    return defaultFields.map((field) => ({
      name: field,
      field: headers.find(
        (header) => header.trim().toLowerCase() === field.trim().toLowerCase(),
      ),
      // biome-ignore lint/suspicious/noExplicitAny: typescript gives an error but this is fine
      mandatory: requiredFields.includes(field as any),
    }))
  }

  const processFile = async (
    file: File,
  ): Promise<
    { ok: true; file: ProcessedFile } | { ok: false; error: string }
  > => {
    try {
      validateFile(file)

      const leadsCount = await countLeadsInFile(file)
      const headers = await getFileHeaders(file)

      return {
        ok: true,
        file: {
          file: file,
          leadsCount: leadsCount,
          headers,
          mappings: generateDefaultMappings(headers),
        },
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao processar arquivo"
      return {
        ok: false,
        error: `${file.name}: ${message}`,
      }
    }
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!event.target.files) return

    const validFiles: ProcessedFile[] = []
    const errors: string[] = []

    for (const file of event.target.files) {
      const processed = await processFile(file)

      if (processed.ok) {
        validFiles.push(processed.file)
      } else {
        errors.push(processed.error)
      }
    }

    setFiles((prev) => [...prev, ...validFiles])
    setFileErrors(errors)

    if (!listName.trim() && validFiles.length > 0) {
      const nameWithoutExtension = validFiles[0].file.name.replace(
        /\.[^/.]+$/,
        "",
      )
      setListName(nameWithoutExtension)
    }
  }

  // Remove file by its key
  const removeFile = (fileKey: string) => {
    setFiles((prev) =>
      prev.filter((file) => generateFileKey(file.file) !== fileKey),
    )
  }

  const removeAllFiles = () => {
    setFiles([])
    setFileErrors([])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const totalLeads = files.reduce((sum, { leadsCount }) => sum + leadsCount, 0)

  return (
    <div className="space-y-2">
      <label className="block font-medium text-sm text-zinc-600">
        Arquivo de Leads (CSV/XLSX)
      </label>

      <div className="relative">
        <input
          type="file"
          id="leadsFile"
          name="leadsFile"
          accept=".csv,.xlsx,.xls"
          multiple
          required={files.length === 0}
          onChange={handleFileChange}
          ref={fileInputRef}
          className={cn(
            "absolute z-10 size-0 opacity-0",
            files.length === 0 && "inset-0 h-full w-full cursor-pointer",
          )}
        />
        {files.length === 0 ? (
          <FileInputPlaceholder hasErrors={fileErrors.length > 0} />
        ) : (
          <div className="flex flex-col gap-2">
            {files.map((file) => (
              <FileCard
                key={generateFileKey(file.file)}
                setFileMappings={(mappings) =>
                  setFiles((prev) =>
                    prev.map((f) =>
                      generateFileKey(f.file) === generateFileKey(file.file)
                        ? { ...f, mappings }
                        : f,
                    ),
                  )
                }
                file={file}
                onRemoveFile={() => removeFile(generateFileKey(file.file))}
              />
            ))}

            <hr className="mt-2 mb-1 border-primary-400 border-dashed" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="font-medium text-primary-800 text-sm">
                  Total: {totalLeads.toLocaleString()} leads
                </div>
                <div className="text-primary-600 text-sm">
                  ({files.length} arquivo
                  {files.length !== 1 ? "s" : ""})
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer text-primary-700 text-sm transition-colors hover:text-primary-700/80"
                >
                  + Adicionar mais
                </button>
                <button
                  type="button"
                  onClick={removeAllFiles}
                  className="cursor-pointer text-red-600 text-sm transition-colors hover:text-red-600/80"
                >
                  Remover todos
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {fileErrors.map((e) => (
        <p key={e} className="text-red-600 text-sm">
          {e}
        </p>
      ))}
    </div>
  )
}

type FileInputPlaceholderProps = {
  hasErrors?: boolean
}

function FileInputPlaceholder({ hasErrors }: FileInputPlaceholderProps) {
  return (
    <div
      className={cn(
        "rounded-lg border-2 border-dashed bg-zinc-100 p-8 text-center transition-colors",
        hasErrors
          ? "border-red-300 bg-red-50"
          : "border-zinc-300 hover:border-zinc-400",
      )}
    >
      <div className="space-y-2">
        <FileUpIcon
          className="mx-auto mb-4 size-16 text-primary-500"
          strokeWidth="1.25"
        />
        <div className="text-zinc-600">Clique ou arraste os arquivos aqui</div>
        <p className="text-sm text-zinc-500">CSV ou XLSX, até 10MB cada</p>
      </div>
    </div>
  )
}

type FileCardProps = {
  file: ProcessedFile
  setFileMappings: (mappings: FieldMapping[]) => void
  onRemoveFile: () => void
}

function FileCard({ file, setFileMappings, onRemoveFile }: FileCardProps) {
  return (
    <div className="flex items-center gap-3 rounded border border-zinc-300 bg-zinc-100 p-2 px-4 shadow">
      <FileIcon className="size-6 text-primary-500" />
      <div className="flex-1">
        <div className="font-medium text-sm text-zinc-900">
          {file.file.name}
        </div>
        <div className="text-sm text-zinc-500">{file.leadsCount} leads</div>
      </div>

      <div className="flex flex-col items-end gap-0.5">
        <FieldsMappingModal file={file} onUpdateMappings={setFileMappings} />
        <Button
          type="button"
          onClick={onRemoveFile}
          variant="outline"
          size="sm"
        >
          Remover
        </Button>
      </div>
    </div>
  )
}

type CreationDialogProps = {
  name?: string
  origin?: string
  files: ProcessedFile[]
}

function canCreate({ name, origin, files }: CreationDialogProps) {
  return (
    !!name &&
    !!origin &&
    files.length > 0 &&
    files.every(
      (file) =>
        requiredFields.every((f) => file.mappings.some((m) => m.name === f)) &&
        file.mappings.every((m) => m.field && file.headers.includes(m.field)),
    )
  )
}

function CreationDialog({ files, name, origin }: CreationDialogProps) {
  const enabled = canCreate({ name, origin, files })

  const [processedFiles, setProcessedFiles] = useState<
    ({
      fileName: string
      totalCount: number
      mappings: FieldMapping[]
    } & (
      | {
          loaded: true
          result: Awaited<ReturnType<typeof extractLeadsFromFile>>
        }
      | {
          loaded: false
        }
    ))[]
  >([])

  const hasErrors = processedFiles.some(
    (f) => f.loaded && f.result.errors.length > 0,
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!enabled) return

    for (const file of files) {
      if (!processedFiles.some((f) => f.fileName === file.file.name)) {
        // add the file in loading state
        setProcessedFiles((prev) => [
          ...prev,
          {
            mappings: file.mappings,
            fileName: file.file.name,
            totalCount: file.leadsCount,
            loaded: false,
          },
        ])

        extractLeadsFromFile(file.file, file.mappings).then((result) => {
          console.log(result)
          setProcessedFiles((prev) =>
            prev.map((f) =>
              f.fileName === file.file.name
                ? { ...f, loaded: true, result }
                : f,
            ),
          )
        })
      }
    }
  }, [files, enabled])

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button disabled={!enabled} className="ml-auto" type="button">
          Criar Lista
        </Button>
      </Dialog.Trigger>
      <Dialog.Content className="[--dialog-content-max-width:_38rem]">
        <Dialog.Header>
          <Dialog.Title>Confirmar criação da lista</Dialog.Title>
        </Dialog.Header>

        <div>
          <ul>
            <li>
              <strong>Nome:</strong> {name}
            </li>
            <li>
              <strong>Origem:</strong> {origin}
            </li>
          </ul>

          <p className="mt-4 text-sm text-zinc-600">Arquivos:</p>
          <ul className="mt-2 space-y-1">
            {processedFiles.map((file) => (
              <ProcessedFileCard key={file.fileName} file={file} />
            ))}
          </ul>
        </div>

        <Dialog.Footer>
          <Dialog.Close asChild>
            <Button variant="outline">Cancelar</Button>
          </Dialog.Close>

          <Button type="submit">
            {hasErrors ? "Ignorar erros e criar" : "Criar"}{" "}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  )
}

type ProcessedFileCardProps = {
  file: {
    fileName: string
    totalCount: number
    loaded: boolean
    result?: Awaited<ReturnType<typeof extractLeadsFromFile>>
    mappings: FieldMapping[]
  }
}

function ProcessedFileCard({ file }: ProcessedFileCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <li key={file.fileName} className="">
      <header className="flex items-center justify-between gap-4">
        <span>
          {file.fileName}

          {file.loaded ? (
            <>
              <span className="ml-2 text-sm text-zinc-600">
                ({file.result?.leads.length} leads extraídos)
              </span>

              <span className="ml-2 text-red-800 text-sm">
                ({file.result?.errors.length} erros encontrados)
              </span>
            </>
          ) : (
            <span className="ml-2 text-sm text-zinc-500">Carregando...</span>
          )}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6 p-1"
          onClick={() => setExpanded((prev) => !prev)}
        >
          <ChevronDown className={cn("size-5", expanded && "rotate-180")} />
        </Button>
      </header>

      {expanded && (
        <div>
          <div className="grid w-full grid-cols-[auto_auto] gap-x-4 border border-zinc-300 bg-zinc-100 text-sm text-zinc-600">
            <span className="col-span-2 grid grid-cols-subgrid bg-primary-50 px-1 font-semibold text-zinc-800">
              <span>Campo</span>
              <span>Coluna</span>
            </span>
            <hr className="col-span-2 border-zinc-300" />
            {file.mappings.map((m) => (
              <span
                className="col-span-2 grid grid-cols-subgrid px-1"
                key={m.name}
              >
                <span>{m.name}</span>
                <span>{m.field}</span>
              </span>
            ))}
          </div>

          <ul className="mt-2 max-h-64 space-y-1 overflow-auto border border-zinc-300 bg-zinc-100 pb-4 text-red-900 text-sm">
            {file.loaded ? (
              file.result?.errors.map((error) => (
                <Fragment key={`${file.fileName}-${error.line}`}>
                  <pre className="w-max px-1">
                    (Linha {error.line}) {error.message}
                    <br />
                    {JSON.stringify(error.row)}
                  </pre>
                  <hr className="border-zinc-300 last:hidden" />
                </Fragment>
              ))
            ) : (
              <li className="text-sm text-zinc-500">Carregando erros...</li>
            )}
          </ul>
        </div>
      )}
    </li>
  )
}