import { db } from '~/db'
import type { lists } from '~/db/schema'

import type { DomainUser } from './UserService'

type DbList = typeof lists.$inferSelect
type NewDbList = typeof lists.$inferSelect

export type DomainList = {
    id: string;
    name: string;
    createdBy: DomainUser;
    createdAt: Date;
    origin: string;
    size: number;
}

class ListService {
    async getAll(): Promise<DomainList[]> {
        // Simulate fetching all lists from a database or API
        return [
            {
                id: "123456",
                name: "Leads calculadora de rescisão",
                createdBy: {
                    id: "user123",
                    name: "Bruno",
                    fullName: "Bruno Silva",
                    role: "ADMIN",
                    auauthId: "auth123",
                    accountActive: true
                },
                createdAt: new Date(),
                origin: "Site",
                size: 100
            },
            {
                id: "789012",
                name: "Leads WhatsApp",
                createdBy: {
                    id: "user456",
                    name: "Maria",
                    fullName: "Maria Oliveira",
                    role: "ADMIN",
                    auauthId: "auth456",
                    accountActive: true
                },
                createdAt: new Date(),
                origin: "WhatsApp",
                size: 50
            }
        ];
    }
}

export default new ListService();