import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function CategorySelect({ value = "", onChange, options = [], placeholder = "בחרו תחום", searchPlaceholder = "חיפוש תחום..." }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          dir="rtl"
          className={cn(
            "w-full justify-between h-12 rounded-full border border-gray-300 text-right font-normal bg-white text-gray-900 hover:bg-white hover:text-gray-900",
            !value && "text-muted-foreground"
          )}
        >
          <span className="flex-1 truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="end"
        side="bottom"
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        <Command dir="rtl">
          <CommandInput placeholder={searchPlaceholder} className="text-right" />
          <CommandList>
            <CommandEmpty>לא נמצאות תוצאות</CommandEmpty>
            <CommandGroup>
              {options.map((option, i) => (
                <CommandItem
                  key={i}
                  value={option}
                  onSelect={(currentValue) => {
                    const newValue = currentValue === value ? "" : currentValue;
                    onChange?.(newValue);
                    setOpen(false);
                  }}
                  className="justify-between text-right"
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === option ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex-1 truncate">{option}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
