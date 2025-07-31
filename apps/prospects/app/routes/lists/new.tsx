import type { Route } from "./+types/new"
import { Form } from "react-router"
import { useRef, useState } from "react"
import { FileUpIcon, FileIcon, XIcon } from "lucide-react"
import { Button, Input } from "iboti-ui"
import Papa from "papaparse"
import * as XLSX from "xlsx"

import { getUserOrRedirect } from "~/utils/authGuard"
import { cn, maxWidth } from "~/utils/styling"

export async function loader({ request }: Route.LoaderArgs) {
  await getUserOrRedirect(request)
  return null
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
      return 0
  }
}

export default function NewList() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [listName, setListName] = useState("")
  const [fileError, setFileError] = useState<string | null>(null)
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({})
  const [isCountingLeads, setIsCountingLeads] = useState<
    Record<string, boolean>
  >({})

  const generateFileKey = (file: File) =>
    `${file.name}-${file.size}-${file.lastModified}`

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    const validFiles: File[] = []
    const errors: string[] = []

    for (const file of files) {
      // Check for duplicates
      const fileKey = generateFileKey(file)
      const isDuplicate = selectedFiles.some(
        (existingFile) => generateFileKey(existingFile) === fileKey,
      )

      if (isDuplicate) {
        errors.push(`${file.name}: Arquivo já foi adicionado`)
        continue
      }

      // Validate file type
      const allowedTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ]
      const allowedExtensions = [".csv", ".xls", ".xlsx"]

      const fileExtension = file.name
        .toLowerCase()
        .substring(file.name.lastIndexOf("."))
      const isValidType =
        allowedTypes.includes(file.type) ||
        allowedExtensions.includes(fileExtension)

      if (!isValidType) {
        errors.push(
          `${file.name}: Apenas arquivos CSV, XLS ou XLSX são permitidos`,
        )
        continue
      }

      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        errors.push(`${file.name}: O arquivo deve ter no máximo 10MB`)
        continue
      }

      validFiles.push(file)
    }

    // Set error message if there are any errors
    if (errors.length > 0) {
      setFileError(errors.join("; "))
    } else {
      setFileError(null)
    }

    // Add valid files even if some were invalid
    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles])

      // Count leads for each new valid file
      for (const file of validFiles) {
        const fileKey = generateFileKey(file)
        setIsCountingLeads((prev) => ({ ...prev, [fileKey]: true }))

        try {
          const count = await countLeadsInFile(file)
          setFileCounts((prev) => ({ ...prev, [fileKey]: count }))
        } catch (error) {
          console.error("Error counting leads:", error)
          setFileCounts((prev) => ({ ...prev, [fileKey]: 0 }))
        } finally {
          setIsCountingLeads((prev) => ({ ...prev, [fileKey]: false }))
        }
      }

      // If no name is set and we have files, use the first filename without extension
      if (!listName.trim()) {
        const nameWithoutExtension = validFiles[0].name.replace(/\.[^/.]+$/, "")
        setListName(nameWithoutExtension)
      }
    }

    // Reset file input to allow selecting the same files again
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListName(event.target.value)
  }

  const removeFile = (fileToRemove: File) => {
    const fileKey = generateFileKey(fileToRemove)
    setSelectedFiles((prev) =>
      prev.filter((file) => generateFileKey(file) !== fileKey),
    )
    setFileCounts((prev) => {
      const newCounts = { ...prev }
      delete newCounts[fileKey]
      return newCounts
    })
    setIsCountingLeads((prev) => {
      const newCounting = { ...prev }
      delete newCounting[fileKey]
      return newCounting
    })
  }

  const removeAllFiles = () => {
    setSelectedFiles([])
    setFileError(null)
    setFileCounts({})
    setIsCountingLeads({})
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const totalLeads = Object.values(fileCounts).reduce(
    (sum, count) => sum + count,
    0,
  )
  const hasCountingFiles = Object.values(isCountingLeads).some(Boolean)

  return (
    <div className={maxWidth("pt-4")}>
      <h1 className="mb-4 font-semibold text-2xl text-primary-700">
        Nova lista
      </h1>

      <Form method="post" className="space-y-4">
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
            <Input type="text" id="origin" name="origin" required />
          </label>
        </div>

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
              required={selectedFiles.length === 0}
              onChange={handleFileChange}
              ref={fileInputRef}
              className={cn(
                "absolute z-10 size-0 opacity-0",
                selectedFiles.length === 0 &&
                  "inset-0 h-full w-full cursor-pointer",
              )}
            />
            {selectedFiles.length === 0 ? (
              <div
                className={cn(
                  "rounded-lg border-2 border-dashed bg-zinc-100 p-8 text-center transition-colors",
                  fileError
                    ? "border-red-300 bg-red-50"
                    : "border-zinc-300 hover:border-zinc-400",
                )}
              >
                <div className="space-y-2">
                  <FileUpIcon
                    className="mx-auto mb-4 size-16 text-primary-500"
                    strokeWidth="1.25"
                  />
                  <div className="text-zinc-600">
                    Clique ou arraste os arquivos aqui
                  </div>
                  <p className="text-sm text-zinc-500">
                    CSV ou XLSX, até 10MB cada
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedFiles.map((file) => {
                  const fileKey = generateFileKey(file)
                  const isCountingFile = isCountingLeads[fileKey]
                  const fileCount = fileCounts[fileKey] || 0

                  return (
                    <div
                      key={fileKey}
                      className="flex items-center gap-3 rounded border border-zinc-300 bg-zinc-100 p-2 px-4 shadow"
                    >
                      <FileIcon className="size-6 text-primary-500" />
                      <div className="flex-1">
                        <div className="font-medium text-sm text-zinc-900">
                          {file.name}
                        </div>
                        <div className="text-sm text-zinc-500">
                          {isCountingFile
                            ? "Contando leads..."
                            : `${fileCount.toLocaleString()} leads`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file)}
                        className="rounded-sm p-1 text-zinc-400 transition-colors hover:bg-red-200 hover:text-red-800"
                      >
                        <XIcon className="size-4" />
                      </button>
                    </div>
                  )
                })}

                <div className="flex items-center justify-between rounded border border-primary-200 bg-primary-50 p-3">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-primary-800 text-sm">
                      Total:{" "}
                      {hasCountingFiles
                        ? "Contando..."
                        : `${totalLeads.toLocaleString()} leads`}
                    </div>
                    <div className="text-primary-600 text-sm">
                      ({selectedFiles.length} arquivo
                      {selectedFiles.length !== 1 ? "s" : ""})
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary-700 text-sm hover:text-primary-800"
                    >
                      + Adicionar mais
                    </button>
                    <button
                      type="button"
                      onClick={removeAllFiles}
                      className="text-red-600 text-sm hover:text-red-700"
                    >
                      Remover todos
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {fileError && <p className="text-red-600 text-sm">{fileError}</p>}
        </div>

        <Button type="submit">Criar Lista</Button>
      </Form>
    </div>
  )
}
