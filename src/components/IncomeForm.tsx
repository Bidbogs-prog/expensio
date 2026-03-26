import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const DEFAULT_CATEGORIES = ["Freelance", "9 to 5", "Business", "Rent"];

export function IncomeForm() {
  const addIncome = useExpenseStore((state) => state.addIncome);
  const currentIncome = useExpenseStore((state) => state.currentIncome);

  const [showCustom, setShowCustom] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [addedCategories, setAddedCategories] = useState<string[]>([]);

  const existingCategories = [...new Set(currentIncome.map((i) => i.category))];
  const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...existingCategories, ...addedCategories])];

  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      category: "",
      name: "",
      amount: "",
    } as IncomeFormValues,
  });

  function onSubmit(values: IncomeFormValues) {
    addIncome(values);
    form.reset();
    setShowCustom(false);
    setCustomCategory("");
  }

  const addCustom = () => {
    const trimmed = customCategory.trim();
    if (trimmed) {
      setAddedCategories((prev) => [...prev, trimmed]);
      form.setValue("category", trimmed, { shouldValidate: true });
      setCustomCategory("");
      setShowCustom(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground mb-1">Add New Income</h3>
          <p className="text-sm text-muted-foreground">Record your income sources</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Category</FormLabel>
                {showCustom ? (
                  <div className="flex gap-2">
                    <Input
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
                      placeholder="Category name"
                      className="h-9 shadow-soft text-sm"
                      autoFocus
                    />
                    <Button type="button" size="sm" onClick={addCustom} className="h-9 px-3 shadow-soft">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowCustom(false)} className="h-9 px-3">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                ) : (
                  <Select
                    onValueChange={(val) => {
                      if (val === "__custom__") {
                        setShowCustom(true);
                      } else {
                        field.onChange(val);
                      }
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="shadow-soft transition-smooth hover:shadow-medium">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            {category}
                          </div>
                        </SelectItem>
                      ))}
                      <SelectItem value="__custom__">
                        <div className="flex items-center gap-2 text-primary">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add custom category
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Income name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Salary, Bonus, etc."
                    className="shadow-soft transition-smooth focus:shadow-medium"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    onWheel={(e) => e.currentTarget.blur()}
                    className="shadow-soft overflow-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-smooth focus:shadow-medium"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            className="w-full sm:w-auto min-w-[140px] shadow-soft hover:shadow-medium transition-smooth gradient-primary text-white"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Income
          </Button>
        </div>
      </form>
    </Form>
  );
}
