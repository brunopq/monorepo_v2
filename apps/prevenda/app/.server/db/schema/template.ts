import { createSelectSchema, createInsertSchema } from "drizzle-zod"
import { boolean, pgTable, smallint, text } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import type { z } from "zod"

import { baseTable, id } from "./utils"

import { fieldTypes } from "./fieldType"
import { submission } from "./submission"

export const template = pgTable("templates", {
  ...baseTable,
  name: text().notNull(),
  description: text(),
})

export const templateRelations = relations(template, ({ many }) => ({
  fields: many(templateField),
  submissions: many(submission),
}))

export const templateSchema = createSelectSchema(template)
export const newTemplateSchema = createInsertSchema(template)

export type Template = z.infer<typeof templateSchema>
export type NewTemplate = z.infer<typeof newTemplateSchema>

export const templateField = pgTable("template_fields", {
  ...baseTable,
  templateId: id()
    .notNull()
    .references(() => template.id),
  name: text().notNull(),
  required: boolean().notNull(),
  type: fieldTypes().notNull(),
  order: smallint().notNull(),
})

export const templateFieldRelations = relations(
  templateField,
  ({ one, many }) => ({
    formTemplate: one(template, {
      fields: [templateField.templateId],
      references: [template.id],
    }),
    // not important for now ?
    // formSubmissionFields: many(formSubmissionFields),
  }),
)

export const templateFieldSchema = createSelectSchema(templateField)
export const newTemplateFieldSchema = createInsertSchema(templateField)

export type TemplateField = z.infer<typeof templateFieldSchema>
export type NewTemplateField = z.infer<typeof newTemplateFieldSchema>
