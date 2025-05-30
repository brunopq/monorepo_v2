import { AsteriskIcon } from "lucide-react"

import type {
  FormField,
  FormFieldType,
} from "~/.server/services/TemplateService"

import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import type { UseBoundStore } from "zustand/react"
import type { StoreApi } from "zustand/vanilla"
import { useShallow } from "zustand/react/shallow"
import type { JSX } from "react"

export type FillableFormField = Omit<FormField, "formTemplateId"> & {
  value: string | number | boolean
}

type FormTemplatePreviewProps = {
  useFields: Store
}

type Write<T, U> = Omit<T, keyof U> & U

type Store = UseBoundStore<
  StoreApi<
    Write<
      {
        fields: {
          name: string
          id: string
          type: "number" | "date" | "text" | "textarea" | "checkbox"
          formTemplateId: string
          required: boolean
          order: number
        }[]
      },
      {
        setField: (
          fieldId: string,
          fieldData: Partial<FillableFormField>,
        ) => void
      }
    >
  >
>

export function FormTemplatePreview({ useFields }: FormTemplatePreviewProps) {
  const fields = useFields((state) => state.fields)

  return (
    <div className="w-full space-y-4">
      {fields.map((field) => (
        <Field key={field.id} fieldId={field.id} useFields={useFields} />
      ))}
    </div>
  )
}

type FieldProps = {
  useFields: Store
  fieldId: string
}
function Field({ useFields, fieldId }: FieldProps) {
  const [field, setField] = useFields(
    useShallow((state) => [
      state.fields.find((f) => f.id === fieldId),
      state.setField,
    ]),
  )

  if (!field) return null

  const fieldTypeInputMap: Record<FormFieldType, JSX.Element> = {
    text: (
      <label>
        <Input
          onChange={(e) => setField(field.id, { value: e.target.value })}
          type="text"
          placeholder={`${field.name}...`}
        />
      </label>
    ),
    number: (
      <label>
        <Input
          onChange={(e) =>
            setField(field.id, { value: e.target.valueAsNumber })
          }
          type="number"
          placeholder={`${field.name}...`}
        />
      </label>
    ),
    textarea: (
      <label>
        <Textarea
          onChange={(e) => setField(field.id, { value: e.target.value })}
          placeholder={`${field.name}...`}
        />
      </label>
    ),
    date: (
      <label>
        <Input
          onChange={(e) => setField(field.id, { value: e.target.value })}
          type="date"
          placeholder={`${field.name}...`}
        />
      </label>
    ),
    checkbox: (
      <label className="flex items-center gap-2">
        <input
          onChange={(e) => setField(field.id, { value: e.target.checked })}
          type="checkbox"
        />
        <span>{field.name}</span>
      </label>
    ),
  }

  return (
    <div className="">
      <strong className="-mb-0.5 relative inline-block text-sm text-zinc-700 dark:text-zinc-400">
        <span className="overflow-hidden overflow-ellipsis">{field.name}</span>
        {field.required && (
          <AsteriskIcon className="-translate-y-1/6 absolute top-0 right-0 size-3.5 translate-x-4/5 text-red-500 dark:text-red-400" />
        )}
      </strong>

      {fieldTypeInputMap[field.type]}
    </div>
  )
}
