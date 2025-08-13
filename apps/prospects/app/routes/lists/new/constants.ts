export const requiredFields = [
    "Nome",
    "Telefone",
    "CPF",
] as const

export const defaultFields = [
    ...requiredFields,
    "Data de nascimento",
    "Estado",
] as const
