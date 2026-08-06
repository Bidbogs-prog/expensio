"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency, useSetCurrency } from "@/lib/queries";
import { convertPersonalAmounts } from "@/lib/api";
import { fetchRate } from "@/lib/rates";
import type { Currency } from "@/types";

const CURRENCIES = ["USD", "MAD", "EUR"] as const;

type PendingSwitch = {
  to: Currency;
  rate: number | null; // null while loading; stays null if rates are unreachable
};

export function CurrencySelect() {
  const currency = useCurrency();
  const setCurrency = useSetCurrency();
  const qc = useQueryClient();

  const [pending, setPending] = useState<PendingSwitch | null>(null);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSwitch = async (to: Currency) => {
    if (to === currency) return;
    setError(null);
    setPending({ to, rate: null });
    try {
      setPending({ to, rate: await fetchRate(currency, to) });
    } catch {
      // Rates unreachable — user can still relabel.
      setPending({ to, rate: null });
      setError("Live rate unavailable — you can still switch without converting.");
    }
  };

  const relabel = () => {
    if (!pending) return;
    setCurrency.mutate(pending.to);
    setPending(null);
  };

  const convert = async () => {
    if (!pending?.rate) return;
    setConverting(true);
    setError(null);
    try {
      await convertPersonalAmounts(pending.rate);
      setCurrency.mutate(pending.to);
      // Amounts changed in every table — refetch everything.
      qc.invalidateQueries();
      setPending(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed.");
    } finally {
      setConverting(false);
    }
  };

  return (
    <>
      <Select onValueChange={(v) => startSwitch(v as Currency)} value={currency}>
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

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            aria-label="Cancel currency switch"
            onClick={() => !converting && setPending(null)}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-medium reveal">
            <button
              onClick={() => !converting && setPending(null)}
              className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 text-primary">
              <ArrowRightLeft className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                {currency} → {pending.to}
              </span>
            </div>
            <h2 className="mt-2 font-display text-lg font-bold tracking-tight">
              Convert existing amounts?
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {pending.rate === null && !error ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching live rate…
                </span>
              ) : pending.rate !== null ? (
                <>
                  Multiply your personal amounts by the live rate{" "}
                  <span className="font-mono font-semibold text-foreground">
                    1 {currency} = {pending.rate.toFixed(4)} {pending.to}
                  </span>
                  , or keep the numbers and just switch the label. Family budgets
                  are shared and stay unchanged either way.
                </>
              ) : null}
            </p>
            {error && <p className="mt-2 text-xs text-rose-500 dark:text-rose-400">{error}</p>}

            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={relabel} disabled={converting}>
                Just relabel
              </Button>
              <Button
                onClick={convert}
                disabled={pending.rate === null || converting}
                className="glow-primary"
              >
                {converting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Convert amounts
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
