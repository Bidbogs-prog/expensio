"use client";

import { useState } from "react";
import { ArrowLeftRight, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateTransfer } from "@/lib/queries";
import type { Account } from "@/types";

/** Move money between two of your accounts — e.g. an ATM withdrawal card → cash. */
export function TransferForm({
  accounts,
  currency,
}: {
  accounts: Account[];
  currency: string;
}) {
  const create = useCreateTransfer();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  const valid =
    from && to && from !== to && Number(amount) > 0 && !Number.isNaN(Date.parse(date));

  const submit = () => {
    if (!valid) return;
    create.mutate(
      { from_account_id: from, to_account_id: to, amount: Number(amount), date, note: null },
      { onSuccess: () => setAmount("") }
    );
  };

  return (
    <Card className="p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
          <ArrowLeftRight className="h-[1.05rem] w-[1.05rem]" />
        </span>
        <div>
          <h3 className="font-display text-sm font-bold leading-none tracking-tight">
            Transfer
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Between your accounts — never counted as spending
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">From</Label>
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger>
                <SelectValue placeholder="Account" />
              </SelectTrigger>
              <SelectContent>
                {accounts
                  .filter((a) => a.id !== to)
                  .map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <ArrowRight className="mb-2.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="space-y-1.5">
            <Label className="text-xs">To</Label>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger>
                <SelectValue placeholder="Account" />
              </SelectTrigger>
              <SelectContent>
                {accounts
                  .filter((a) => a.id !== from)
                  .map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Amount ({currency})</Label>
            <Input
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={submit}
          disabled={!valid || create.isPending}
          className="w-full font-semibold"
        >
          <ArrowLeftRight className="h-4 w-4" />
          Move money
        </Button>
      </div>
    </Card>
  );
}
