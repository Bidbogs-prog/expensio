"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useExpenseStore } from "@/useExpenseStore";

const CURRENCIES = ["USD", "MAD", "EUR"] as const;

export function CurrencySelect() {
  const currency = useExpenseStore((s) => s.currency);
  const setCurrency = useExpenseStore((s) => s.setCurrency);

  return (
    <Select onValueChange={setCurrency} value={currency}>
      <SelectTrigger className="w-[88px] shadow-soft" aria-label="Currency">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((cur) => (
          <SelectItem key={cur} value={cur}>
            {cur}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
