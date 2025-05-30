import { and, eq } from "drizzle-orm"

import type {
  Submission,
  SubmittedField,
  NewSubmission,
  NewSubmittedField,
} from "../db/schema/submission"

import { submission, submittedField } from "../db/schema"
import { db } from "../db"

class SubmissionService {
  private ensureOnlyOneValue(submissionField: SubmittedField) {
    const checkKeys: (keyof SubmittedField)[] = [
      "dateValue",
      "checkboxValue",
      "textValue",
      "numberValue",
      "textareaValue",
    ]

    let truthyCount = 0

    for (const key of checkKeys) {
      if (submissionField[key] !== null) {
        truthyCount++
      }
    }

    return truthyCount === 1
  }

  async listByUser(uid: string) {
    return await db.query.submission.findMany({
      // where: (fs, {eq}) => eq(fs.submitterId, uid),
      with: {
        submittedFields: { with: { templateField: true } },
        template: true,
      },
    })
  }

  async create(newSubmission: NewSubmission): Promise<Submission> {
    const [createdSubmission] = await db
      .insert(submission)
      .values({
        templateId: newSubmission.templateId,
        submitterId: newSubmission.submitterId,
      })
      .returning()

    return createdSubmission
  }

  async get(submissionId: string) {
    return await db.query.submission.findFirst({
      where: (s, { eq }) => eq(s.id, submissionId),
      with: {
        submittedFields: { with: { templateField: true } },
        template: { with: { fields: true } },
      },
    })
  }

  async createSubmittedField(
    newSubmittedField: NewSubmittedField,
  ): Promise<SubmittedField> {
    const [createdField] = await db
      .insert(submittedField)
      .values(newSubmittedField)
      .returning()

    return createdField
  }
  async updateSubmittedField(
    submissionId: string,
    templateFieldId: string,
    updateSubmittedField: Partial<NewSubmittedField>,
  ): Promise<SubmittedField> {
    const [updatedField] = await db
      .update(submittedField)
      .set(updateSubmittedField)
      .where(
        and(
          eq(submittedField.submissionId, submissionId),
          eq(submittedField.templateFieldId, templateFieldId),
        ),
      )
      .returning()

    return updatedField
  }

  async syncSubmittedFields(
    submissionId: string,
    syncFields: SubmittedField[],
  ): Promise<SubmittedField[]> {
    const oldSubmittedFields = new Set(
      (
        await db
          .select({ id: submittedField.templateFieldId })
          .from(submittedField)
          .where(eq(submittedField.submissionId, submissionId))
      ).map(({ id }) => id),
    )

    const updatedFields = await Promise.all(
      syncFields
        .map((field) => {
          if (!this.ensureOnlyOneValue(field)) {
            // field has invalid number of values truthy
            return
          }

          if (oldSubmittedFields.has(field.templateFieldId)) {
            oldSubmittedFields.delete(field.templateFieldId)

            return this.updateSubmittedField(
              submissionId,
              field.templateFieldId,
              field,
            )
          }

          return this.createSubmittedField(field)
        })
        .filter((f) => f !== undefined),
    )

    return updatedFields
  }
}

export default new SubmissionService()
