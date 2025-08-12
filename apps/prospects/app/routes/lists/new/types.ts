
export type ProcessedFile = {
    file: File
    leadsCount: number
    headers: string[]
    mapping: Partial<Record<string, string | undefined>>
}
