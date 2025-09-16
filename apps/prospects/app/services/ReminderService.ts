import { z } from "zod/v4"
import { addDays, addWeeks } from 'date-fns'

import { db } from "~/db"
import { reminders } from '~/db/schema'

type DbReminder = typeof reminders.$inferSelect
type NewDbReminder = typeof reminders.$inferInsert

export const reminderPeriods = ["disabled", "1_day", "2_days", "1_week"] as const

export const reminderPeriodsSchema = z.enum(reminderPeriods)

export type ReminderPeriod = z.infer<typeof reminderPeriodsSchema>

export const domainReminderSchema = z.object({
    id: z.string(),
    leadId: z.number(),
    sellerId: z.string(),
    createdAt: z.date(),
    remindAt: z.date(),
    message: z.string()
})

export const newDomainReminderSchema = domainReminderSchema.omit({
    id: true,
    createdAt: true,
    remindAt: true,
}).extend({
    remindIn: reminderPeriodsSchema
})

export type DomainReminder = z.infer<typeof domainReminderSchema>
export type NewDomainReminder = z.infer<typeof newDomainReminderSchema>

class ReminderService {
    async insert(reminder: NewDbReminder): Promise<DbReminder> {
        const [inserted] = await db.insert(reminders).values({
            leadId: reminder.leadId,
            sellerId: reminder.sellerId,
            createdAt: reminder.createdAt,
            remindAt: reminder.remindAt,
            message: reminder.message,
        }).returning()

        return inserted
    }

    private addPeriod(date: Date, remindIn: ReminderPeriod): Date {
        if (remindIn === '1_day')
            return addDays(date, 1)
        if (remindIn === '2_days') return addDays(date, 2)
        if (remindIn === '1_week') return addWeeks(date, 1)

        return date
    }

    async create(newReminder: NewDomainReminder): Promise<DomainReminder> {
        console.log('creating reminder')
        if (newReminder.remindIn === 'disabled') {
            throw new Error("wtf do you want bro")
        }

        const now = new Date()

        const remindTime = this.addPeriod(now, newReminder.remindIn)

        return await this.insert({
            createdAt: now,
            leadId: newReminder.leadId,
            message: newReminder.message,
            remindAt: remindTime,
            sellerId: newReminder.sellerId,
        })
    }
}

export default new ReminderService()