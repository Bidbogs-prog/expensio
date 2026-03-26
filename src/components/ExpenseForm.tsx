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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useExpenseStore } from "@/useExpenseStore";
import { expenseFormSchema, ExpenseFormValues } from "@/form-schemas";

const DEFAULT_CATEGORIES = ["food", "transport", "bills", "entertainment"];

export function ExpenseForm() {
  const addExpense = useExpenseStore((state) => state.addExpense);
  const expenses = useExpenseStore((state) => state.expenses);
  const renameExpenseCategory = useExpenseStore((state) => state.renameExpenseCategory);
  const isLoading = useExpenseStore((state) => state.isLoading);

  const [showCustom, setShowCustom] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [addedCategories, setAddedCategories] = useState<string[]>([]);
  const [showManage, setShowManage] = useState(false);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);

  const existingCategories = [...new Set(expenses.map((e) => e.category))];
  const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...existingCategories, ...addedCategories])]
    .filter((c) => !hiddenCategories.includes(c));

  const getCategoryCount = (cat: string) => expenses.filter((e) => e.category === cat).length;

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      category: "",
      name: "",
      amount: "",
    } as ExpenseFormValues,
  });

  function onSubmit(values: ExpenseFormValues) {
    addExpense(values);
    form.reset();
    setShowCustom(false);
    setCustomCategory("");
  }

  const addCustom = () => {
    const trimmed = customCategory.trim().toLowerCase();
    if (trimmed) {
      setAddedCategories((prev) => [...prev, trimmed]);
      form.setValue("category", trimmed, { shouldValidate: true });
      setCustomCategory("");
      setShowCustom(false);
    }
  };

  const startEditingCat = (cat: string) => {
    setEditingCat(cat);
    setEditingCatName(cat);
  };

  const saveEditCat = async () => {
    if (!editingCat || !editingCatName.trim()) return;
    const newName = editingCatName.trim().toLowerCase();
    if (newName === editingCat) {
      setEditingCat(null);
      return;
    }

    const count = getCategoryCount(editingCat);
    if (count > 0) {
      await renameExpenseCategory(editingCat, newName);
    }

    setAddedCategories((prev) =>
      prev.map((c) => (c === editingCat ? newName : c))
    );

    if (form.getValues("category") === editingCat) {
      form.setValue("category", newName, { shouldValidate: true });
    }

    setEditingCat(null);
  };

  const deleteCat = (cat: string) => {
    if (getCategoryCount(cat) > 0) return;
    setAddedCategories((prev) => prev.filter((c) => c !== cat));
    setHiddenCategories((prev) => [...prev, cat]);
    if (form.getValues("category") === cat) {
      form.setValue("category", "", { shouldValidate: true });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Add New Expense</h3>
            <p className="text-sm text-muted-foreground">Fill in the details to track your expense</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowManage(!showManage)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Manage categories
          </Button>
        </div>

        {showManage && (
          <div className="border rounded-lg p-4 bg-muted/20 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Categories</p>
            {allCategories.map((cat) => {
              const count = getCategoryCount(cat);
              const isEditing = editingCat === cat;
              return (
                <div key={cat} className="flex items-center gap-2 group">
                  <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></div>
                  {isEditing ? (
                    <Input
                      value={editingCatName}
                      onChange={(e) => setEditingCatName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveEditCat(); } if (e.key === "Escape") setEditingCat(null); }}
                      className="h-7 text-sm flex-1"
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm flex-1">
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
                  {isEditing ? (
                    <>
                      <Button type="button" variant="ghost" size="sm" onClick={saveEditCat} disabled={isLoading} className="h-7 w-7 p-0">
                        <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditingCat(null)} className="h-7 w-7 p-0">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button type="button" variant="ghost" size="sm" onClick={() => startEditingCat(cat)} disabled={isLoading} className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCat(cat)}
                        disabled={count > 0 || isLoading}
                        title={count > 0 ? `${count} expense(s) use this category` : "Remove category"}
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive disabled:text-muted-foreground"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
            {allCategories.length === 0 && (
              <p className="text-xs text-muted-foreground">No categories. Add one using the dropdown below.</p>
            )}
          </div>
        )}

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
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
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
                <FormLabel className="text-sm font-medium">Expense name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Groceries, Taxi, etc."
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
                    className="shadow-soft [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-smooth focus:shadow-medium"
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
            Add Expense
          </Button>
        </div>
      </form>
    </Form>
  );
}
