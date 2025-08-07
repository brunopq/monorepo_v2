import type { interactionStatuses, interactionTypes } from '~/constants/interactions';
import {db} from '../db'

export type InteractionTypes = typeof interactionTypes[number]
export type InteractionStatuses = typeof interactionStatuses[number]

export type DomainInteraction = {
    id: string;
    leadId: string;
    sellerId: string;
    contactedAt: Date;
    interactionType: InteractionTypes;
    status: InteractionStatuses;
    notes?: string;
}

export class InteractionService {
    
}

export default new InteractionService()