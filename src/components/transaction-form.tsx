"use client";

import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Check, ChevronDown, Paperclip, Pencil, Plus, Settings2, Trash2, X } from "lucide-react";
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
  useAccounts,
  useAddTransaction,
  useGroupTransactions,
  useRenameCategory,
  useSettings,
  useTransactions,
  useUpdateCategoryPrefs,
} from "@/lib/queries";
import { receiptsApi } from "@/lib/api";
import { expenseFormSchema, type ExpenseFormValues } from "@/form-schemas";
import { TX_CONFIG, formatCategory, type TxKind } from "@/lib/transaction-ui";
import { ACCOUNT_TYPES } from "@/lib/accounts";

const CUSTOM_VALUE = "__custom__";
const NO_ACCOUNT = "__none__";

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
  const [showManage, setShowManage] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  // Category being deleted that still has transactions → pick a new home first.
  const [reassignCat, setReassignCat] = useState<string | null>(null);
  const [reassignTarget, setReassignTarget] = useState("");

  // Accounts are personal, but a family row still names YOUR paying account.
  const { data: accounts } = useAccounts();
  const activeAccounts = (accounts ?? []).filter((a) => !a.archived);

  // Custom + hidden lists persist in user_settings so edits survive reloads.
  const { data: settings } = useSettings();
  const prefs = useUpdateCategoryPrefs(kind);
  const customCategories = settings?.custom_categories?.[kind] ?? [];
  const hiddenCategories = settings?.hidden_categories?.[kind] ?? [];

  const uniq = (a: string[]) => [...new Set(a)];
  const existingCategories = [...new Set(items.map((i) => i.category))];
  const allCategories = [
    ...new Set([...cfg.defaultCategories, ...existingCategories, ...customCategories]),
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
      account: "",
      payee: "",
      note: "",
      tags: "",
      receipt: "",
    } as ExpenseFormValues,
  });

  async function onSubmit(values: ExpenseFormValues) {
    let receipt = "";
    if (receiptFile) {
      setUploading(true);
      setUploadError(null);
      try {
        receipt = await receiptsApi.upload(receiptFile);
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "Upload failed");
        setUploading(false);
        return; // keep the form filled so the user can retry
      }
      setUploading(false);
    }
    add.mutate({ ...values, receipt });
    form.reset();
    setShowCustom(false);
    setCustomCategory("");
    setReceiptFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const addCustom = () => {
    const normalized = cfg.normalizeCategory(customCategory);
    if (normalized) {
      prefs.mutate({
        custom: uniq([...customCategories, normalized]),
        // Re-adding a previously deleted category revives it.
        hidden: hiddenCategories.filter((c) => c !== normalized),
      });
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
    if (!newName || newName === editingCat) {
      setEditingCat(null);
      return;
    }
    if (getCategoryCount(editingCat) > 0) {
      await rename.mutateAsync({ oldName: editingCat, newName });
    }
    prefs.mutate({
      // Keep the new name visible even with no transactions; a renamed default
      // hides its old name so it doesn't linger next to the new one.
      custom: uniq([...customCategories.filter((c) => c !== editingCat), newName]),
      hidden: uniq([
        ...hiddenCategories.filter((c) => c !== newName),
        ...(cfg.defaultCategories.includes(editingCat) ? [editingCat] : []),
      ]),
    });
    if (form.getValues("category") === editingCat) {
      form.setValue("category", newName, { shouldValidate: true });
    }
    setEditingCat(null);
  };

  /** Persistently remove a category from the pickable lists. */
  const hideCategory = (cat: string) => {
    prefs.mutate({
      custom: customCategories.filter((c) => c !== cat),
      hidden: uniq([...hiddenCategories, cat]),
    });
    if (form.getValues("category") === cat) {
      form.setValue("category", "", { shouldValidate: true });
    }
  };

  const deleteCat = (cat: string) => {
    if (getCategoryCount(cat) > 0) {
      // Still in use — ask where its transactions should move first.
      setReassignCat(cat);
      setReassignTarget("");
      return;
    }
    hideCategory(cat);
  };

  const confirmReassign = async () => {
    if (!reassignCat || !reassignTarget) return;
    await rename.mutateAsync({ oldName: reassignCat, newName: reassignTarget });
    hideCategory(reassignCat);
    setReassignCat(null);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold tracking-tight">{cfg.addHeading}</h3>
            <p className="text-sm text-muted-foreground">{cfg.addSubheading}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails((v) => !v)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronDown
                className={cn("mr-1 h-3.5 w-3.5 transition-transform", showDetails && "rotate-180")}
              />
              More details
            </Button>
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
        </div>

        {canManage && showManage && (
          <div className="space-y-1 rounded-lg border bg-muted/30 p-3">
            <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Categories
            </p>
            {allCategories.map((cat) => {
              const count = getCategoryCount(cat);
              const isEditing = editingCat === cat;
              if (reassignCat === cat) {
                return (
                  <div key={cat} className="flex flex-wrap items-center gap-2 rounded-md bg-muted/50 px-1 py-1">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", cfg.dotClass)} />
                    <span className="text-sm font-medium">{formatCategory(cat)}</span>
                    <span className="text-xs text-muted-foreground">
                      move {count} item{count === 1 ? "" : "s"} to
                    </span>
                    <Select value={reassignTarget} onValueChange={setReassignTarget}>
                      <SelectTrigger className="h-7 w-36 text-xs">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {allCategories
                          .filter((c) => c !== cat)
                          .map((c) => (
                            <SelectItem key={c} value={c}>
                              {formatCategory(c)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={confirmReassign}
                      disabled={!reassignTarget || busy}
                      className="h-7 w-7 p-0"
                      title="Move items and delete category"
                    >
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setReassignCat(null)}
                      className="h-7 w-7 p-0"
                      title="Cancel"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              }
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
                        disabled={busy}
                        title={
                          count > 0
                            ? `Delete — you'll pick where its ${count} item(s) move`
                            : "Remove category"
                        }
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

          {activeAccounts.length > 0 && (
            <FormField
              control={form.control}
              name="account"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(val === NO_ACCOUNT ? "" : val)}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="shadow-soft">
                        <SelectValue placeholder="No account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_ACCOUNT}>
                        <span className="text-muted-foreground">No account</span>
                      </SelectItem>
                      {activeAccounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            {ACCOUNT_TYPES[a.type].label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {showDetails && (
          <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={form.control}
                name="payee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payee</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Marjane, CIH ATM" className="shadow-soft" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input placeholder="comma-separated, e.g. work, ramadan" className="shadow-soft" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Receipt</FormLabel>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9 shadow-soft"
                  >
                    <Paperclip className="mr-1.5 h-3.5 w-3.5" />
                    {receiptFile ? "Change" : "Attach"}
                  </Button>
                  {receiptFile && (
                    <>
                      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                        {receiptFile.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReceiptFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="h-7 w-7 p-0"
                        title="Remove attachment"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
              </FormItem>
            </div>
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Input placeholder="Anything worth remembering about this one" className="shadow-soft" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Tip: a negative amount records a refund — it gives the money back to the month.
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={busy || uploading} className="w-full shadow-soft sm:w-auto sm:min-w-[150px]">
            <Plus className="mr-1.5 h-4 w-4" />
            {uploading ? "Uploading receipt…" : cfg.addHeading}
          </Button>
        </div>
      </form>
    </Form>
  );
}
