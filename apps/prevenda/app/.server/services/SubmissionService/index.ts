import { and, eq } from "drizzle-orm"

import type {
  Submission,
  SubmittedField,
  NewSubmission,
  NewSubmittedField,
} from "../../db/schema/submission"
import { submission, submittedField } from "../../db/schema"
import type { Template, TemplateField } from "../../db/schema/template"
import { db } from "../../db"

import AuthService, { type User } from "../AuthService"

export type FullSubmittedField = SubmittedField & {
  templateField: TemplateField
}

export type SubmissionWithTemplate = Submission & { template: Template }
export type FullSubmission = Submission & {
  template: Template
  submitter?: User
  submittedFields: FullSubmittedField[]
}

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

  async list(token: string): Promise<FullSubmission[]> {
    const submissions = await db.query.submission.findMany({
      with: {
        submittedFields: { with: { templateField: true } },
        template: true,
      },
    })

    const users = await AuthService.getUsers(
      token,
      submissions.map((s) => s.submitterId),
    )

    return submissions.map((s) => ({
      ...s,
      submitter: users.get(s.submitterId),
    }))
  }

  // TODO: remove token and add service-to-service authentication for user requests
  async listByUser(uid: string, token: string) {
    const submissions = await db.query.submission.findMany({
      where: (s, { eq }) => eq(s.submitterId, uid),
      with: {
        submittedFields: { with: { templateField: true } },
        template: true,
      },
    })

    const users = await AuthService.getUsers(
      token,
      submissions.map((s) => s.submitterId),
    )

    return submissions.map((s) => ({
      ...s,
      submitter: users.get(s.submitterId),
    }))
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

  async get(token: string, submissionId: string) {
    const submission = await db.query.submission.findFirst({
      where: (s, { eq }) => eq(s.id, submissionId),
      with: {
        submittedFields: { with: { templateField: true } },
        template: { with: { fields: true } },
      },
    })

    if (!submission) {
      return null
    }

    const user = await AuthService.getUsers(token, [submission.submitterId])

    return {
      ...submission,
      submitter: user.get(submission.submitterId),
    }
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
