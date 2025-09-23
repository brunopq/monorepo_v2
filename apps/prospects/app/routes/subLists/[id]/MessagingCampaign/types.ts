export type MappingVariants = "simple" | "merge" | "split"

export type Mapping =
    | {
        id: string
        type: "simple"
        column: string | null
    }
    | {
        id: string
        type: "merge"
        columns: (string | null)[]
    }
    | {
        id: string
        type: "split"
        column: string | null
        separators: string
    }

export type FieldMapping = {
    id: string
    /**
     * Output name
     */
    name: string
    mappings: Mapping[]
    mapperFn: ((data: Record<string, string>) => string[]) | null
}