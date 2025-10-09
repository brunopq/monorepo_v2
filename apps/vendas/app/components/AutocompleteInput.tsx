import { Button, Input, type InputProps, Popover } from "iboti-ui"
import { useEffect, useRef, useState } from "react"

import { normalizeText } from "~/lib/formatters"

type AutocompleteInputProps = InputProps & {
  options: string[]
}

export function AutocompleteInput({
  options,
  ...props
}: AutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const optionsRef = useRef<HTMLButtonElement[]>([])
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(
    // only allow strings
    props.defaultValue?.toString() || "",
  )

  // Filter options based on input
  const filteredOptions = options.filter((option) => {
    if (!inputValue.trim()) return true
    const normalizedOption = normalizeText(option)
    const normalizedInput = normalizeText(inputValue)
    return normalizedOption.includes(normalizedInput)
  })

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestionsOpen) return

    switch (e.key) {
      case "ArrowDown":
      case "Tab":
        if (suggestionsOpen) {
          e.preventDefault()
          optionsRef.current[0]?.focus()
        }
        break
      case "Escape":
        setSuggestionsOpen(false)
        inputRef.current?.focus()
        break
      case "Enter":
        if (filteredOptions.length > 0 && suggestionsOpen) {
          e.preventDefault()
          handleSelect(filteredOptions[0])
        }
        break
    }
  }

  const handleOptionKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    switch (e.key) {
      case "ArrowDown": {
        const nextIndex = (index + 1) % filteredOptions.length
        optionsRef.current[nextIndex]?.focus()
        break
      }
      case "ArrowUp": {
        const prevIndex = index === 0 ? filteredOptions.length - 1 : index - 1
        optionsRef.current[prevIndex]?.focus()
        break
      }
      case "Tab": {
        setSuggestionsOpen(false)
        break
      }
      case "Enter":
        e.preventDefault()
        handleSelect(filteredOptions[index])
        break
      case "Escape":
        setSuggestionsOpen(false)
        inputRef.current?.focus()
        break
    }
  }

  const handleSelect = (option: string) => {
    // Update the input value directly
    if (inputRef.current) {
      inputRef.current.value = option
      // Trigger change event for form handling
      const event = new Event("input", { bubbles: true })
      inputRef.current.dispatchEvent(event)
    }
    setInputValue(option)
    setSuggestionsOpen(false)
    inputRef.current?.focus()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setSuggestionsOpen(true)
    props.onInput?.(e)
  }

  const handleFocus = () => {
    // setSuggestionsOpen(true)
  }

  const handleBlur = (e: React.FocusEvent) => {
    // Check if focus is moving to one of our option buttons
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget?.closest("[data-suggestion-option]")) {
      return // Don't close if focusing on an option
    }
    setSuggestionsOpen(false)
  }

  useEffect(() => {
    if (filteredOptions.length === 0) {
      setSuggestionsOpen(false)
    }
  }, [filteredOptions])

  return (
    <Popover.Root
      modal={false}
      open={suggestionsOpen}
      onOpenChange={setSuggestionsOpen}
    >
      <Popover.Anchor aria-disabled={props.disabled}>
        <Input
          ref={inputRef}
          onClick={() => setSuggestionsOpen(true)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onInput={handleInputChange}
          autoComplete="off"
          {...props}
        />
      </Popover.Anchor>

      <Popover.Content
        aria-disabled={props.disabled}
        align="start"
        className="flex max-h-60 flex-col overflow-auto p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {filteredOptions.map((option, index) => (
          <Button
            key={option}
            ref={(el) => {
              if (el) optionsRef.current[index] = el
            }}
            className="justify-start rounded-xs font-normal text-base"
            size="sm"
            variant="ghost"
            data-suggestion-option
            onKeyDown={(e) => handleOptionKeyDown(e, index)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleSelect(option)}
          >
            {option}
          </Button>
        ))}
      </Popover.Content>
    </Popover.Root>
  )
}
