export { Button, ButtonProps } from "./components/button"
export { Input, InputProps } from "./components/input"
import * as BaseDialog from "./components/dialog"
import * as BaseSelect from "./components/select"
import * as BaseTable from "./components/table"
import * as ToastPrimitives from "./components/toast"

export const Dialog = {
  Root: BaseDialog.Dialog,
  Close: BaseDialog.DialogClose,
  Content: BaseDialog.DialogContent,
  Description: BaseDialog.DialogDescription,
  Footer: BaseDialog.DialogFooter,
  Header: BaseDialog.DialogHeader,
  Overlay: BaseDialog.DialogOverlay,
  Portal: BaseDialog.DialogPortal,
  Title: BaseDialog.DialogTitle,
  Trigger: BaseDialog.DialogTrigger,
}

export const Select = {
  Root: BaseSelect.Select,
  Group: BaseSelect.SelectGroup,
  Value: BaseSelect.SelectValue,
  Trigger: BaseSelect.SelectTrigger,
  Content: BaseSelect.SelectContent,
  Label: BaseSelect.SelectLabel,
  Item: BaseSelect.SelectItem,
  Separator: BaseSelect.SelectSeparator,
}

export const Table = {
  Root: BaseTable.Table,
  Body: BaseTable.TableBody,
  Caption: BaseTable.TableCaption,
  Cell: BaseTable.TableCell,
  Head: BaseTable.TableHead,
  Header: BaseTable.TableHeader,
  Row: BaseTable.TableRow,
  Footer: BaseTable.TableFooter,
}

export const Toast = {
  Provider: ToastPrimitives.ToastProvider,
  Viewport: ToastPrimitives.ToastViewport,
  Title: ToastPrimitives.ToastTitle,
  Description: ToastPrimitives.ToastDescription,
  Action: ToastPrimitives.ToastAction,
  Close: ToastPrimitives.ToastClose,
}

export const useToast = ToastPrimitives.useToast
export const toast = ToastPrimitives.toast
export const Toaster = ToastPrimitives.Toaster
