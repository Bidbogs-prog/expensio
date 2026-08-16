"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Plus, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateAccount } from "@/lib/queries";
import { accountFormSchema, type AccountFormValues } from "@/form-schemas";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_ORDER } from "@/lib/accounts";

/** Add a place money lives: a bank account, a card, or the cash in your pocket. */
export function AccountForm({ currency }: { currency: string }) {
  const create = useCreateAccount();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: { name: "", type: "checking", opening: "" },
  });

  const onSubmit = (values: AccountFormValues) => {
    create.mutate(
      {
        name: values.name.trim(),
        type: values.type,
        opening_balance: values.opening ? Number(values.opening) : 0,
      },
      { onSuccess: () => form.reset() }
    );
  };

  return (
    <Card className="border-dashed p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
          <Wallet className="h-[1.05rem] w-[1.05rem]" />
        </span>
        <div>
          <h3 className="font-display text-sm font-bold leading-none tracking-tight">
            New account
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            A place money lives — bank, card, or cash
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Attijariwafa, Wallet" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ACCOUNT_TYPE_ORDER.map((t) => (
                        <SelectItem key={t} value={t}>
                          {ACCOUNT_TYPES[t].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="opening"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Balance now ({currency})</FormLabel>
                  <FormControl>
                    <Input inputMode="decimal" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={create.isPending}
            className="w-full font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add account
          </Button>
        </form>
      </Form>
    </Card>
  );
}
