export const subListStates = [
    "new",
    "in_progress",
    "completed",
    "canceled",
] as const

export type SubListState = (typeof subListStates)[number]
