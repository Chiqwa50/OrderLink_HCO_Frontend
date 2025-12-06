"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
  value: string
  onValueChange: (value: string) => void
  options: string[]
  placeholder?: string
  emptyText?: string
  searchPlaceholder?: string
  className?: string
}

export function Combobox({
  value,
  onValueChange,
  options,
  placeholder = "اختر...",
  emptyText = "لا توجد نتائج",
  searchPlaceholder = "بحث...",
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value)

  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue)
    setInputValue(selectedValue)
    setOpen(false)
  }

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)
    onValueChange(newValue)
  }

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(inputValue.toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {inputValue || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => handleSelect(option)}
                >
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4",
                      value === option ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option}
                </CommandItem>
              ))}
              {inputValue &&
                !options.some(
                  (option) => option.toLowerCase() === inputValue.toLowerCase()
                ) && (
                  <CommandItem
                    value={inputValue}
                    onSelect={() => handleSelect(inputValue)}
                  >
                    <Check className="ml-2 h-4 w-4 opacity-0" />
                    إضافة &quot;{inputValue}&quot;
                  </CommandItem>
                )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
