import type { FieldMapping } from "./types";

function simpleExtractor(column: string, row: Record<string, string>): string {
    return row[column] || ""
}

function mergeExtractor(columns: string[], row: Record<string, string>): string {
    return columns.map(c => row[c] || "").join(" ")
}

function splitExtractor(column: string, separators: string, row: Record<string, string>): string[] {
    const value = row[column] || ""
    const regex = new RegExp(`[${separators}]`, 'g')
    return value.split(regex).map(v => v.trim()).filter(v => v.length > 0)
}

export function extractorFn(mapping: FieldMapping): (row: Record<string, string>) => string[] {
    return (row: Record<string, string>) =>
        mapping.mappings.flatMap(m => {
            if (m.type === "simple" && m.column)
                return simpleExtractor(m.column, row)
            if (m.type === "merge" && m.columns.length)
                return mergeExtractor(m.columns.filter(c => c !== null), row)
            if (m.type === "split" && m.column)
                return splitExtractor(m.column, m.separators, row)

            return ""
        })
}