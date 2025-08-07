export const interactionTypes = [
    'whatsapp_message',
    'whatsapp_call',
    'call',
    'email',
    'other' // I have no idea what that might be
] as const

export const interactionTypesLabels: Record<typeof interactionTypes[number], string> = {
    whatsapp_message: 'Mensagem WhatsApp',
    whatsapp_call: 'Ligação WhatsApp',
    call: 'Ligação',
    email: 'Email',
    other: 'Outro'
}

export const interactionStatuses = [
    'waiting_response',
    'no_response',
    'wrong_person',
    'no_interest',
    'not_reachable',
    'interested',
    'converted', // lead converted to customer
    'lost' // lead lost
] as const

export const interactionStatusesLabels: Record<typeof interactionStatuses[number], string> = {
    waiting_response: 'Aguardando resposta',
    no_response: 'Sem resposta',
    wrong_person: 'Pessoa errada',
    no_interest: 'Sem interesse',
    not_reachable: 'Não contatável',
    interested: 'Interessado',
    converted: 'Convertido',
    lost: 'Perdido'
}