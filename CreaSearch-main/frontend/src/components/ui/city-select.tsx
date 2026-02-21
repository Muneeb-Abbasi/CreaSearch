import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { searchCities, getCitiesByCountry } from "@/data/countries-cities";

interface CitySelectProps {
  value?: string;
  countryCode?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CitySelect({ 
  value, 
  countryCode,
  onValueChange, 
  placeholder = "Select city...",
  disabled = false,
  className
}: CitySelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const availableCities = countryCode ? getCitiesByCountry(countryCode) : [];
  const filteredCities = searchQuery 
    ? searchCities(searchQuery, countryCode)
    : availableCities.slice(0, 20);

  const isDisabled = disabled || !countryCode;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={isDisabled}
          className={cn("w-full justify-between", className)}
        >
          {value || (isDisabled ? "Select country first" : placeholder)}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search city..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
            disabled={isDisabled}
          />
          <CommandList>
            {isDisabled ? (
              <CommandEmpty>Please select a country first</CommandEmpty>
            ) : filteredCities.length === 0 ? (
              <CommandEmpty>No city found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredCities.map((city) => (
                  <CommandItem
                    key={city}
                    value={city}
                    onSelect={() => {
                      onValueChange(city === value ? "" : city);
                      setOpen(false);
                      setSearchQuery("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === city ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {city}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
