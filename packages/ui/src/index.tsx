export { Button, ButtonProps } from "./components/button"
export { Input, InputProps } from "./components/input"
import * as BaseDialog from "./components/dialog"
import * as BaseSelect from "./components/select"

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
