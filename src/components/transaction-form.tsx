"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Check, Pencil, Plus, Settings2, Trash2, X } from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
  useAddTransaction,
  useGroupTransactions,
  useRenameCategory,
  useTransactions,
} from "@/lib/queries";
import { expenseFormSchema, type ExpenseFormValues } from "@/form-schemas";
import { TX_CONFIG, formatCategory, type TxKind } from "@/lib/transaction-ui";

const CUSTOM_VALUE = "__custom__";

export function TransactionForm({
  kind,
  groupId = null,
}: {
  kind: TxKind;
  groupId?: string | null;
}) {
  const cfg = TX_CONFIG[kind];
  const canManage = !groupId; // renaming shared categories would touch other members' rows

  const add = useAddTransaction(kind, groupId);
  const rename = useRenameCategory(kind, groupId);
  const personal = useTransactions(kind);
  const group = useGroupTransactions(kind, groupId);
  const source = groupId ? group : personal;
  const items = source.data ?? [];
  const isLoading = source.isLoading;
  const busy = isLoading || add.isPending || rename.isPending;

  const [showCustom, setShowCustom] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [addedCategories, setAddedCategories] = useState<string[]>([]);
  const [showManage, setShowManage] = useState(false);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);

  const existingCategories = [...new Set(items.map((i) => i.category))];
  const allCategories = [
    ...new Set([...cfg.defaultCategories, ...existingCategories, ...addedCategories]),
  ].filter((c) => !hiddenCategories.includes(c));

  const getCategoryCount = (cat: string) =>
    items.filter((i) => i.category === cat).length;

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      category: "",
      name: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
    } as ExpenseFormValues,
  });

  function onSubmit(values: ExpenseFormValues) {
    add.mutate(values);
    form.reset();
    setShowCustom(false);
    setCustomCategory("");
  }

  const addCustom = () => {
    const normalized = cfg.normalizeCategory(customCategory);
    if (normalized) {
      setAddedCategories((prev) => [...prev, normalized]);
      form.setValue("category", normalized, { shouldValidate: true });
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
    const newName = cfg.normalizeCategory(editingCatName);
    if (newName === editingCat) {
      setEditingCat(null);
      return;
    }
    if (getCategoryCount(editingCat) > 0) {
      await rename.mutateAsync({ oldName: editingCat, newName });
    }
    setAddedCategories((prev) => prev.map((c) => (c === editingCat ? newName : c)));
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold tracking-tight">{cfg.addHeading}</h3>
            <p className="text-sm text-muted-foreground">{cfg.addSubheading}</p>
          </div>
          {canManage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowManage((v) => !v)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <Settings2 className="mr-1 h-3.5 w-3.5" />
              Manage categories
            </Button>
          )}
        </div>

        {canManage && showManage && (
          <div className="space-y-1 rounded-lg border bg-muted/30 p-3">
            <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Categories
            </p>
            {allCategories.map((cat) => {
              const count = getCategoryCount(cat);
              const isEditing = editingCat === cat;
              return (
                <div key={cat} className="group flex items-center gap-2 rounded-md px-1 py-0.5">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", cfg.dotClass)} />
                  {isEditing ? (
                    <Input
                      value={editingCatName}
                      onChange={(e) => setEditingCatName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveEditCat();
                        }
                        if (e.key === "Escape") setEditingCat(null);
                      }}
                      className="h-7 flex-1 text-sm"
                      autoFocus
                    />
                  ) : (
                    <span className="flex-1 text-sm">{formatCategory(cat)}</span>
                  )}
                  <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
                  {isEditing ? (
                    <>
                      <Button type="button" variant="ghost" size="sm" onClick={saveEditCat} disabled={busy} className="h-7 w-7 p-0">
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditingCat(null)} className="h-7 w-7 p-0">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button type="button" variant="ghost" size="sm" onClick={() => startEditingCat(cat)} disabled={busy} className="h-7 w-7 p-0 opacity-0 transition-opacity group-hover:opacity-100">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCat(cat)}
                        disabled={count > 0 || busy}
                        title={count > 0 ? `${count} item(s) use this category` : "Remove category"}
                        className="h-7 w-7 p-0 text-destructive opacity-0 transition-opacity group-hover:opacity-100 disabled:text-muted-foreground"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
            {allCategories.length === 0 && (
              <p className="px-1 text-xs text-muted-foreground">
                No categories. Add one using the dropdown below.
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                {showCustom ? (
                  <div className="flex gap-2">
                    <Input
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustom();
                        }
                        if (e.key === "Escape") setShowCustom(false);
                      }}
                      placeholder="Category name"
                      className="h-9 text-sm shadow-soft"
                      autoFocus
                    />
                    <Button type="button" size="icon" onClick={addCustom} className="h-9 w-9 shrink-0">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="outline" onClick={() => setShowCustom(false)} className="h-9 w-9 shrink-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Select
                    onValueChange={(val) => {
                      if (val === CUSTOM_VALUE) setShowCustom(true);
                      else field.onChange(val);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="shadow-soft">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          <div className="flex items-center gap-2">
                            <span className={cn("h-2 w-2 rounded-full", cfg.dotClass)} />
                            {formatCategory(category)}
                          </div>
                        </SelectItem>
                      ))}
                      <SelectItem value={CUSTOM_VALUE}>
                        <div className="flex items-center gap-2 text-primary">
                          <Plus className="h-3.5 w-3.5" />
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
                <FormLabel>{cfg.nameLabel}</FormLabel>
                <FormControl>
                  <Input placeholder={cfg.namePlaceholder} className="shadow-soft" {...field} />
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
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0"
                    onWheel={(e) => e.currentTarget.blur()}
                    className="shadow-soft [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" className="shadow-soft" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={busy} className="w-full shadow-soft sm:w-auto sm:min-w-[150px]">
            <Plus className="mr-1.5 h-4 w-4" />
            {cfg.addHeading}
          </Button>
        </div>
      </form>
    </Form>
  );
}
