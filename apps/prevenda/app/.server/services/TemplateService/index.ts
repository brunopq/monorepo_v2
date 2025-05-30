import { eq, sql } from "drizzle-orm"

import type {
  NewTemplate,
  NewTemplateField,
  Template,
  TemplateField,
} from "../db/schema/template"
import { submission, template, templateField } from "../db/schema"

import { db } from "../db"

export type TemplateWithFields = Template & {
  fields: TemplateField[]
}
export type NewTemplateWithFields = NewTemplate & {
  fields: NewTemplateField[]
}

class TemplateService {
  async listTemplates() {
    return await db.query.template.findMany({
      extras: {
        fieldCount: db.$count(templateField).as("field_count"),
        submissionCount: db.$count(submission).as("submission_count"),
      },
    })
  }

  async getTemplate(id: string) {
    return await db.query.template.findFirst({
      where: (t, { eq }) => eq(t.id, id),
      with: {
        fields: {
          orderBy: (tf, { asc }) => [asc(tf.order)],
        },
      },
    })
  }

  async createTemplate(newTemplate: NewTemplate): Promise<Template> {
    const [createdTemplate] = await db
      .insert(template)
      .values(newTemplate)
      .returning()

    return createdTemplate
  }

  async createTemplateField(
    newTemplateField: NewTemplateField,
  ): Promise<TemplateField> {
    const [createdTemplateField] = await db
      .insert(templateField)
      .values({
        templateId: newTemplateField.templateId,
        name: newTemplateField.name,
        order: newTemplateField.order,
        required: newTemplateField.required,
        type: newTemplateField.type,
      })
      .returning()

    return createdTemplateField
  }

  async createManyTemplateFields(
    newTemplateFields: NewTemplateField[],
  ): Promise<TemplateField[]> {
    const createdTemplateFields = await db
      .insert(templateField)
      .values(newTemplateFields)
      .returning()

    return createdTemplateFields
  }

  async updateTemplate(
    templateId: string,
    updateTemplate: Partial<NewTemplate>,
  ): Promise<Template> {
    const [updatedTemplate] = await db
      .update(template)
      .set(updateTemplate)
      .where(eq(template.id, templateId))
      .returning()

    return updatedTemplate
  }

  async updateTemplateField(
    templateFieldId: string,
    updateTemplateField: Partial<NewTemplateField>,
  ): Promise<TemplateField> {
    const [updatedTemplateField] = await db
      .update(templateField)
      .set(updateTemplateField)
      .where(eq(templateField.id, templateFieldId))
      .returning()

    return updatedTemplateField
  }

  async createWithFields(
    newTemplate: NewTemplateWithFields,
  ): Promise<TemplateWithFields> {
    const [createdTemplate] = await db
      .insert(template)
      .values({
        name: newTemplate.name,
        description: newTemplate.description,
      })
      .returning()

    const createdTemplateFields = await db
      .insert(templateField)
      .values(
        newTemplate.fields.map((field) => ({
          ...field,
          templateId: createdTemplate.id,
        })),
      )
      .returning()

    return {
      ...createdTemplate,
      fields: createdTemplateFields,
    }
  }

  async deleteTemplateField(fieldId: string) {
    await db.delete(templateField).where(eq(templateField.id, fieldId))
  }

  async syncTemplateAndFields(
    templateWithFields: TemplateWithFields,
  ): Promise<TemplateWithFields> {
    const updatedTemplate = await this.updateTemplate(templateWithFields.id, {
      name: templateWithFields.name,
      description: templateWithFields.description,
    })

    const oldIds = new Set(
      (
        await db
          .select({ id: templateField.id })
          .from(templateField)
          .where(eq(templateField.templateId, templateWithFields.id))
      ).map(({ id }) => id),
    )

    const updatedFields = await Promise.all(
      templateWithFields.fields.map((field) => {
        if (oldIds.has(field.id)) {
          oldIds.delete(field.id)
          return this.updateTemplateField(field.id, field)
        }

        return this.createTemplateField(field)
      }),
    )

    for (const fieldId of oldIds) {
      await this.deleteTemplateField(fieldId)
    }

    return {
      ...updatedTemplate,
      fields: updatedFields,
    }
  }
}

export default new TemplateService()
