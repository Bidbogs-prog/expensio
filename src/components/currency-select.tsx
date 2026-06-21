"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency, useSetCurrency } from "@/lib/queries";
import type { Currency } from "@/types";

const CURRENCIES = ["USD", "MAD", "EUR"] as const;

export function CurrencySelect() {
  const currency = useCurrency();
  const setCurrency = useSetCurrency();

  return (
    <Select onValueChange={(v) => setCurrency.mutate(v as Currency)} value={currency}>
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
