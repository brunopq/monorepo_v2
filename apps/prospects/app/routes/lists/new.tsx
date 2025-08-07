import type { Route } from "./+types/new"
import { Form, Link, useFetcher } from "react-router"
import { useRef, useState } from "react"
import { FileUpIcon, FileIcon, XIcon, ArrowLeftIcon } from "lucide-react"
import { Button, Dialog, Input, Select } from "iboti-ui"
import Papa from "papaparse"
import * as XLSX from "xlsx"
import { z } from "zod/v4"

import ListService from "~/services/ListService"
import type { DomainLead, NewDomainLead } from "~/services/LeadService"

import { getUserOrRedirect } from "~/utils/authGuard"
import { cn, maxWidth } from "~/utils/styling"
import LeadService from "~/services/LeadService"

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

function countLeadsInCSV(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    let lineCount = 0

    Papa.parse(file, {
      step: () => {
        lineCount++
      },
      complete: () => {
        // Subtract 1 to account for header row (assuming there's a header)
        resolve(Math.max(0, lineCount - 1))
      },
      error: (error) => {
        console.error("Error parsing CSV:", error)
        reject(error)
      },
      skipEmptyLines: true,
    })
  })
}

function countLeadsInExcel(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })

        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // Convert to JSON to count rows
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        // Filter out empty rows and subtract 1 for header (assuming there's a header)
        const nonEmptyRows = jsonData.filter(
          (row) =>
            Array.isArray(row) &&
            row.some(
              (cell) => cell !== null && cell !== undefined && cell !== "",
            ),
        )

        resolve(Math.max(0, nonEmptyRows.length - 1))
      } catch (error) {
        console.error("Error parsing Excel file:", error)
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error("Failed to read Excel file"))
    }

    reader.readAsArrayBuffer(file)
  })
}

async function countLeadsInFile(file: File): Promise<number> {
  const fileExtension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."))

  switch (fileExtension) {
    case ".csv":
      return countLeadsInCSV(file)
    case ".xls":
    case ".xlsx":
      return countLeadsInExcel(file)
    default:
      throw new Error("Tipo de arquivo não suportado")
  }
}

async function getCSVHeaders(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        if (results.meta.fields) {
          resolve(results.meta.fields)
        } else {
          reject(new Error("Não foi possível obter os cabeçalhos do CSV"))
        }
      },
      error: (error) => {
        console.error("Erro ao ler CSV:", error)
        reject(error)
      },
    })
  })
}

async function getExcelHeaders(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })

        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // Get headers from the first row
        const headers = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          range: 0,
        })[0] as string[]

        if (headers) {
          resolve(headers)
        } else {
          reject(new Error("Não foi possível obter os cabeçalhos do Excel"))
        }
      } catch (error) {
        console.error("Erro ao ler Excel:", error)
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error("Falha ao ler o arquivo Excel"))
    }

    reader.readAsArrayBuffer(file)
  })
}

async function getFileHeaders(file: File): Promise<string[]> {
  const fileExtension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."))

  switch (fileExtension) {
    case ".csv":
      return getCSVHeaders(file)
    case ".xls":
    case ".xlsx":
      return getExcelHeaders(file)
    default:
      throw new Error("Tipo de arquivo não suportado")
  }
}

async function extractLeadsFromCSV(
  file: File,
  mapping: Partial<Record<string, string>>,
): Promise<NewDomainLead[]> {
  return new Promise((resolve, reject) => {
    const leads: NewDomainLead[] = []

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        for (const row of results.data) {
          const lead = {
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            name: row[mapping["Nome"]],
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            phoneNumber: row[mapping["Telefone"]],
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            cpf: row[mapping["CPF"]],
            birthDate: mapping["Data de nascimento"]
              ? row[mapping["Data de nascimento"]]
              : null,
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            state: mapping["Estado"] ? row[mapping["Estado"]] : null,
            extra: {},
          } satisfies NewDomainLead

          // Add any additional fields from mapping
          for (const [key, value] of Object.entries(mapping)) {
            if (
              value &&
              key !== "Nome" &&
              key !== "Telefone" &&
              key !== "CPF"
            ) {
              lead.extra[key] = row[value] || ""
            }
          }

          leads.push(lead)
        }

        resolve(leads)
      },
      error: (error) => {
        console.error("Erro ao processar CSV:", error)
        reject(error)
      },
    })
  })
}

async function extractLeadsFromExcel(
  file: File,
  mapping: Partial<Record<string, string>>,
): Promise<NewDomainLead[]> {
  throw new Error("Função não implementada: extractLeadsFromExcel")
}

async function extractLeadsFromFile(
  file: File,
  mapping: Partial<Record<string, string>>,
): Promise<NewDomainLead[]> {
  const fileExtension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."))

  switch (fileExtension) {
    case ".csv":
      return extractLeadsFromCSV(file, mapping)
    case ".xls":
    case ".xlsx":
      return extractLeadsFromExcel(file, mapping)
    default:
      throw new Error("Tipo de arquivo não suportado")
  }
}

export default function NewList({actionData}: Route.ComponentProps) {
  const fetcher = useFetcher()

  const [listName, setListName] = useState("")
  const [origin, setOrigin] = useState("")
  const [files, setFiles] = useState<ProcessedFile[]>([])

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListName(event.target.value)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const requiredFields = ["Nome", "Telefone", "CPF"]

    const leads: NewDomainLead[] = []

    for (const file of files) {
      console.log(file)
      if (!requiredFields.every((field) => file.mapping[field])) {
        alert(
          `O arquivo "${file.file.name}" deve conter os campos obrigatórios: ${requiredFields.join(
            ", ",
          )}`,
        )
        return
      }

      for (const [key, value] of Object.entries(file.mapping)) {
        if (!value) {
          alert(
            `O campo "${key}" não está mapeado no arquivo "${file.file.name}". Remova o campo ou mapeie-o corretamente.`,
          )
          return
        }

        if (!file.headers.includes(value)) {
          alert(
            `O campo "${key}" está mapeado para "${value}", que não existe no arquivo "${file.file.name}".`,
          )
          return
        }
      }

      const fileLeads = await extractLeadsFromFile(file.file, file.mapping)
      console.log(fileLeads)
      leads.push(...fileLeads)
    }

    const payload = {
      name: listName,
      origin: origin,
      leads: leads.map((l) => ({
        ...l,
        birthDate: l.birthDate?.toISOString() || null,
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
      <fetcher.Form
        method="post"
        className="space-y-4"
        encType="multipart/form-data"
        onSubmit={handleSubmit}
      >
        <header className="mb-4 flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link to="..">
              <ArrowLeftIcon />
            </Link>
          </Button>

          <h1 className="font-semibold text-2xl text-primary-700">
            Nova lista
          </h1>

          <Button className="ml-auto" type="submit">
            Criar Lista
          </Button>
        </header>

        <div className="flex gap-2">
          <label
            htmlFor="name"
            className="flex-1 font-medium text-sm text-zinc-600"
          >
            Nome da Lista
            <Input
              type="text"
              id="name"
              name="name"
              value={listName}
              onChange={handleNameChange}
              required
            />
          </label>
          <label
            htmlFor="origin"
            className="flex-1 font-medium text-sm text-zinc-600"
          >
            Origem
            <Input
              type="text"
              id="origin"
              name="origin"
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

type ProcessedFile = {
  file: File
  leadsCount: number
  headers: string[]
  mapping: Partial<Record<string, string | null>>
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
          mapping: {
            Nome: null,
            Telefone: null,
            CPF: null,
            "Data de nascimento": null,
            Estado: null,
          },
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
              <ProcessedFileCard
                key={generateFileKey(file.file)}
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

type ProcessedFileCardProps = {
  file: ProcessedFile
  onRemoveFile: () => void
}

function ProcessedFileCard({ file, onRemoveFile }: ProcessedFileCardProps) {
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
        <FieldsMappingModal file={file} />
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

type FieldsMappingModalProps = {
  file: ProcessedFile
}

function FieldsMappingModal({ file }: FieldsMappingModalProps) {
  const [localMapping, setLocalMapping] = useState<
    Partial<Record<string, string | null>>
  >(file.mapping)
  const [newMappingKey, setNewMappingKey] = useState("")
  const [newMappingValue, setNewMappingValue] = useState("")

  const addMapping = () => {
    if (newMappingKey.trim() && newMappingValue) {
      setLocalMapping((prev) => ({
        ...prev,
        [newMappingKey.trim()]: newMappingValue,
      }))
      setNewMappingKey("")
      setNewMappingValue("")
    }
  }

  const removeMapping = (key: string) => {
    setLocalMapping((prev) => {
      const newMapping = { ...prev }
      delete newMapping[key]
      return newMapping
    })
  }

  const saveMappings = () => {
    file.mapping = localMapping
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button size="sm" variant="outline">
          Ver colunas
        </Button>
      </Dialog.Trigger>

      <Dialog.Content className="[--dialog-content-max-width:_38rem]">
        <Dialog.Title>Colunas do arquivo {file.file.name}</Dialog.Title>

        <div className="space-y-4">
          <div>
            <h3 className="mb-2 font-medium text-sm text-zinc-700">
              Colunas disponíveis:
            </h3>
            <div className="line-clamp-3 flex flex-wrap gap-x-4 gap-y-1">
              {file.headers.map((header, index) => (
                <span key={header} className="text-xs text-zinc-600 underline">
                  {header}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-medium text-sm text-zinc-700">
              Mapeamentos:
            </h3>

            {Object.entries(localMapping).length > 0 ? (
              <div className="mb-3 space-y-2">
                {Object.entries(localMapping).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 border-zinc-400 border-b"
                  >
                    <span className="font-medium text-sm">{key}:</span>
                    <Select.Root
                      value={value || ""}
                      onValueChange={(val) =>
                        setLocalMapping((prev) => ({
                          ...prev,
                          [key]: val || null,
                        }))
                      }
                    >
                      <Select.Trigger className="w-fit">
                        <Select.Value placeholder="Selecione uma coluna..." />
                      </Select.Trigger>

                      <Select.Content>
                        {file.headers.map((header) => (
                          <Select.Item key={header} value={header}>
                            {header}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>

                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      onClick={() => removeMapping(key)}
                      className="ml-auto size-6 bg-transparent text-red-600 shadow-none hover:text-red-900"
                    >
                      <XIcon className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-3 text-sm text-zinc-500">
                Nenhum mapeamento criado
              </p>
            )}

            <div className="mt-6">
              <h4 className="mb-2 font-medium text-sm text-zinc-700">
                Adicionar novo mapeamento:
              </h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do campo"
                  value={newMappingKey}
                  onChange={(e) => setNewMappingKey(e.target.value)}
                  className="flex-1"
                />
                <Select.Root
                  value={newMappingValue}
                  onValueChange={setNewMappingValue}
                >
                  <Select.Trigger className="w-fit">
                    <Select.Value placeholder="Selecione uma coluna..." />
                  </Select.Trigger>

                  <Select.Content>
                    {file.headers.map((header) => (
                      <Select.Item key={header} value={header}>
                        {header}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
                <Button
                  type="button"
                  size="sm"
                  onClick={addMapping}
                  disabled={!newMappingKey.trim() || !newMappingValue}
                >
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Dialog.Close asChild>
            <Button variant="outline">Cancelar</Button>
          </Dialog.Close>
          <Dialog.Close asChild>
            <Button onClick={saveMappings}>Salvar</Button>
          </Dialog.Close>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  )
}