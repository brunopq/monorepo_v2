import Papa from "papaparse"
import * as XLSX from "xlsx"
import type { NewDomainLead } from "~/services/LeadService"

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

export async function countLeadsInFile(file: File): Promise<number> {
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

export async function getFileHeaders(file: File): Promise<string[]> {
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

type ParsingError = {
    message: string;
    line: number;
    row: Record<string, string>;
}

async function extractLeadsFromCSV(
    file: File,
    mapping: Partial<Record<string, string>>,
): Promise<{ leads: NewDomainLead[], errors: ParsingError[] }> {
    return new Promise((resolve, reject) => {
        const leads: NewDomainLead[] = []
        const errors: ParsingError[] = []

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0)
                    return reject(new Error(`Erro ao processar o CSV: ${results.errors.join(", ")}`))

                if (!results.data || results.data.length === 0)
                    return reject(new Error("Nenhum dado encontrado no arquivo CSV."))

                if (Array.isArray(results.data[0])) {
                    return reject(new Error("Formato de dados inesperado no CSV."))
                }

                const data = results.data as Record<string, string>[]

                let line = 1 // Start from 1 to account for header row and 1 based index

                for (const row of data) {
                    line++
                    const lead: Record<string, string> = {}

                    for (const [key, mappedField] of Object.entries(mapping)) {
                        if (!mappedField) continue

                        try {
                            lead[key] = row[mappedField]
                        } catch (error) {
                            errors.push({
                                message: `Erro ao mapear campo "${mappedField}"`,
                                line,
                                row,
                            })
                        }
                    }

                    const isValidLead = lead.Nome && lead.Telefone && lead.CPF

                    if (!isValidLead) {
                        errors.push({
                            message: "Lead inválido: Nome, Telefone e CPF são obrigatórios.",
                            line,
                            row,
                        })
                        continue
                    }

                    leads.push({
                        name: lead.Nome,
                        phoneNumber: lead.Telefone,
                        cpf: lead.CPF,
                        birthDate: lead.DataDeNascimento || null,
                        state: lead.Estado || null,
                        listId: "", // Será atribuído posteriormente
                        extra: lead,
                    })
                }

                resolve({ leads, errors })
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
): Promise<{ leads: NewDomainLead[], errors: ParsingError[] }> {
    throw new Error("Função não implementada: extractLeadsFromExcel")
}

export async function extractLeadsFromFile(
    file: File,
    mapping: Partial<Record<string, string>>,
): Promise<{ leads: NewDomainLead[], errors: ParsingError[] }> {
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