import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useExpenseStore } from "@/useExpenseStore";
import { incomeFormSchema, IncomeFormValues } from "@/form-schemas";

export function IncomeForm() {
  const setIncome = useExpenseStore((state) => state.setIncome);

  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      income: "",
    },
  });

  function onSubmit(values: IncomeFormValues) {
    setIncome(values);
    form.reset();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3 mt-5"
      >
        <FormField
          control={form.control}
          name="income"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Income</FormLabel>
              <FormControl>
                <Input
                  className="w-[200px]"
                  placeholder="Enter your income"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-[150px]">
          Add your Income
        </Button>
      </form>
    </Form>
  );
}
