
export type ProcessedFile = {
    file: File
    leadsCount: number
    headers: string[]
    mappings: FieldMapping[]
}

/**
 * Represents a mapping between a field name and its corresponding file header.
 */
export type FieldMapping = {
    id: string
    /**
     * The name that the field will be displayed
     */
    name: string
    /**
     * The header in the file that corresponds to this field
     */
    field: string
    /**
     * Indicates whether the field mapping is included in the lead
     */
    visible: boolean
}