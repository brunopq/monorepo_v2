export const interactionTypes = [
    'whatsapp_message',
    'whatsapp_call',
    'call',
    'email',
    'other' // I have no idea what that might be
] as const

export const interactionStatuses = [
    'waiting_response',
    'no_response',
    'wrong_person',
    'no_interest',
    'has_interest',
    'not_reachable',
    'not_interested',
    'interested',
    'converted', // lead converted to customer
    'lost' // lead lost
] as const