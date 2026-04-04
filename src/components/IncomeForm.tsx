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
  const renameIncomeCategory = useExpenseStore((state) => state.renameIncomeCategory);
  const isLoading = useExpenseStore((state) => state.isLoading);

  const [showCustom, setShowCustom] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [addedCategories, setAddedCategories] = useState<string[]>([]);
  const [showManage, setShowManage] = useState(false);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);

  const existingCategories = [...new Set(currentIncome.map((i) => i.category))];
  const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...existingCategories, ...addedCategories])]
    .filter((c) => !hiddenCategories.includes(c));

  const getCategoryCount = (cat: string) => currentIncome.filter((i) => i.category === cat).length;

  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      category: "",
      name: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
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

  const startEditingCat = (cat: string) => {
    setEditingCat(cat);
    setEditingCatName(cat);
  };

  const saveEditCat = async () => {
    if (!editingCat || !editingCatName.trim()) return;
    const newName = editingCatName.trim();
    if (newName === editingCat) {
      setEditingCat(null);
      return;
    }

    const count = getCategoryCount(editingCat);
    if (count > 0) {
      await renameIncomeCategory(editingCat, newName);
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
            <h3 className="text-lg font-semibold text-foreground mb-1">Add New Income</h3>
            <p className="text-sm text-muted-foreground">Record your income sources</p>
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
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
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
                        title={count > 0 ? `${count} income item(s) use this category` : "Remove category"}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    className="shadow-soft transition-smooth focus:shadow-medium"
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
