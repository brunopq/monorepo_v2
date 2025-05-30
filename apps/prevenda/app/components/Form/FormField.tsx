import { AsteriskIcon } from "lucide-react"
import { format } from "date-fns"

import type { TemplateField } from "~/.server/services/db/schema/template"

import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"

export type FieldWithValue = TemplateField &
  (
    | { type: "text"; value?: string }
    | { type: "textarea"; value?: string }
    | { type: "number"; value?: number }
    | { type: "date"; value?: Date }
    | { type: "checkbox"; value?: boolean }
  )

export type FieldProps = {
  field: FieldWithValue
  setFieldValue: (id: string, value: FieldWithValue["value"]) => void
}
export function FormField({ field, setFieldValue }: FieldProps) {
  return (
    <div className="">
      <strong className="-mb-0.5 relative inline-block text-sm text-zinc-700 dark:text-zinc-400">
        <span className="overflow-hidden overflow-ellipsis">{field.name}</span>
        {field.required && (
          <AsteriskIcon className="-translate-y-1/6 absolute top-0 right-0 size-3.5 translate-x-4/5 text-red-500 dark:text-red-400" />
        )}
      </strong>

      <FieldInput field={field} setFieldValue={setFieldValue} />
    </div>
  )
}

function FieldInput({ field, setFieldValue }: FieldProps) {
  if (field.type === "text")
    return (
      <label>
        <Input
          onChange={(e) => setFieldValue(field.id, e.target.value)}
          type="text"
          placeholder={`${field.name}...`}
          value={field.value}
        />
      </label>
    )
  if (field.type === "number")
    return (
      <label>
        <Input
          onChange={(e) => setFieldValue(field.id, e.target.valueAsNumber)}
          type="number"
          placeholder={`${field.name}...`}
          value={field.value}
        />
      </label>
    )
  if (field.type === "textarea")
    return (
      <label>
        <Textarea
          onChange={(e) => setFieldValue(field.id, e.target.value)}
          placeholder={`${field.name}...`}
          value={field.value}
        />
      </label>
    )
  if (field.type === "date")
    return (
      <label>
        <Input
          onChange={(e) =>
            setFieldValue(field.id, e.target.valueAsDate ?? undefined)
          }
          type="date"
          placeholder={`${field.name}...`}
          value={field.value && format(field.value, "yyyy-MM-dd")}
        />
      </label>
    )
  if (field.type === "checkbox")
    return (
      <label className="flex items-center gap-2">
        <input
          onChange={(e) => setFieldValue(field.id, e.target.checked)}
          checked={field.value}
          type="checkbox"
        />
        <span>{field.name}</span>
      </label>
    )
}
