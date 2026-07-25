"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Sparkles, Target } from "lucide-react";
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
import { useCreateSavingsGoal, useSavingsGoals } from "@/lib/queries";
import { savingsGoalFormSchema, type SavingsGoalFormValues } from "@/form-schemas";
import { nextGoalColor } from "@/lib/savings";

/** Create a savings jar: name it, optionally give it a target and a monthly plan. */
export function SavingsGoalForm({ currency }: { currency: string }) {
  const { data: goals } = useSavingsGoals();
  const create = useCreateSavingsGoal();

  const form = useForm<SavingsGoalFormValues>({
    resolver: zodResolver(savingsGoalFormSchema),
    defaultValues: { name: "", target: "", allocation: "" },
  });

  const onSubmit = (values: SavingsGoalFormValues) => {
    create.mutate(
      {
        name: values.name.trim(),
        target_amount: values.target ? Number(values.target) : null,
        monthly_allocation: values.allocation ? Number(values.allocation) : null,
        color: nextGoalColor(goals ?? []),
      },
      { onSuccess: () => form.reset() }
    );
  };

  return (
    <Card className="border-dashed p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/12 text-sky-400 ring-1 ring-sky-500/20">
          <Target className="h-[1.05rem] w-[1.05rem]" />
        </span>
        <div>
          <h3 className="font-display text-sm font-bold leading-none tracking-tight">
            New goal
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            A jar for money that leaves the spending pool
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
                <FormLabel className="text-xs">Goal name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Emergency fund, Investments" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Target ({currency}, optional)</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" placeholder="10000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="allocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Per month (optional)</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" placeholder="1500" {...field} />
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
            <Sparkles className="h-4 w-4" />
            Create goal
          </Button>
        </form>
      </Form>
    </Card>
  );
}
