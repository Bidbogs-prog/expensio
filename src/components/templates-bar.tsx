"use client";

import { useEffect, useState } from "react";
import { Check, Layers, Loader2, Plus, Repeat, Trash2, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useApplyTemplate,
  useCreateTemplate,
  useDeleteTemplate,
  useSetTemplateAutoApply,
  useTemplates,
} from "@/lib/queries";
import { useCurrentMonth } from "@/hooks/use-derived";
import { TX_CONFIG, type TxKind } from "@/lib/transaction-ui";
import type { BudgetTemplate, TemplateItem } from "@/types";
import { cn } from "@/lib/utils";

const monthLabel = (month: string) =>
  new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

/**
 * One-tap monthly entry: reusable sets of fixed expense/income line items.
 * Applying a template inserts all its items into the selected month at once.
 */
export function TemplatesBar({ kind, groupId }: { kind: TxKind; groupId: string | null }) {
  const month = useCurrentMonth();
  const { data: templates = [] } = useTemplates(kind, groupId);
  const apply = useApplyTemplate(kind, groupId);
  const del = useDeleteTemplate(kind, groupId);
  const setAuto = useSetTemplateAutoApply(kind, groupId);
  const [showCreate, setShowCreate] = useState(false);
  const [justApplied, setJustApplied] = useState<string | null>(null);

  const applyingId = apply.isPending ? apply.variables?.template.id : null;

  const onApply = async (template: BudgetTemplate) => {
    await apply.mutateAsync({ template, month });
    setJustApplied(template.id);
    setTimeout(() => setJustApplied((id) => (id === template.id ? null : id)), 1600);
  };

  return (
    <div className="rounded-xl border border-border/70 bg-secondary/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
            <Layers className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-none">Quick add</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Drop fixed {kind === "expense" ? "bills" : "income"} into {monthLabel(month)} in one tap
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5" />
          New template
        </Button>
      </div>

      {templates.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 px-3 py-3 text-xs text-muted-foreground">
          No templates yet. Save a set of recurring {kind === "expense" ? "expenses" : "income"} —
          like rent, bills and subscriptions — then apply them each month with one tap.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => {
            const total = t.items.reduce((s, it) => s + Number(it.amount), 0);
            const isApplying = applyingId === t.id;
            const applied = justApplied === t.id;
            return (
              <div
                key={t.id}
                className={cn(
                  "group relative flex items-center gap-2 rounded-lg border bg-card px-3 py-2 transition-smooth",
                  applied ? "border-primary/60" : "border-border hover:border-primary/40"
                )}
              >
                <button
                  type="button"
                  onClick={() => onApply(t)}
                  disabled={apply.isPending}
                  className="flex items-center gap-2 text-left"
                  title={`Apply "${t.name}" to ${monthLabel(month)}`}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/12 text-primary">
                    {isApplying ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : applied ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Zap className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block max-w-[12rem] truncate text-sm font-medium">{t.name}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {t.items.length} item{t.items.length === 1 ? "" : "s"} · {Math.round(total).toLocaleString()}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuto.mutate({ id: t.id, autoApply: !t.auto_apply })}
                  disabled={setAuto.isPending}
                  aria-label={
                    t.auto_apply
                      ? `Stop auto-applying ${t.name}`
                      : `Auto-apply ${t.name} every month`
                  }
                  title={
                    t.auto_apply
                      ? "Auto-applies on the 1st of each month — click to turn off"
                      : "Turn on to auto-apply on the 1st of each month (starts next month)"
                  }
                  className={cn(
                    "transition-colors",
                    t.auto_apply
                      ? "text-primary"
                      : "text-muted-foreground/60 opacity-0 hover:text-primary group-hover:opacity-100"
                  )}
                >
                  <Repeat className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => del.mutate(t.id)}
                  disabled={del.isPending}
                  aria-label={`Delete template ${t.name}`}
                  className="text-muted-foreground/60 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <TemplateDialog
          kind={kind}
          groupId={groupId}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

type DraftItem = { category: string; name: string; amount: string };
const EMPTY_ROW: DraftItem = { category: "", name: "", amount: "" };

function TemplateDialog({
  kind,
  groupId,
  onClose,
}: {
  kind: TxKind;
  groupId: string | null;
  onClose: () => void;
}) {
  const cfg = TX_CONFIG[kind];
  const create = useCreateTemplate(kind, groupId);
  const [name, setName] = useState("");
  const [rows, setRows] = useState<DraftItem[]>([{ ...EMPTY_ROW }]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const setRow = (i: number, patch: Partial<DraftItem>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  const removeRow = (i: number) =>
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));

  const items: TemplateItem[] = rows
    .filter((r) => r.category.trim() && r.name.trim() && /^\d+(\.\d{1,2})?$/.test(r.amount.trim()))
    .map((r) => ({
      category: cfg.normalizeCategory(r.category),
      name: r.name.trim(),
      amount: Number(r.amount),
    }));

  const canSave = name.trim().length > 0 && items.length > 0 && !create.isPending;

  const submit = async () => {
    if (!canSave) return;
    await create.mutateAsync({ name: name.trim(), items });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in" />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-medium reveal">
        <div className="relative border-b border-border bg-gradient-to-b from-primary/10 to-transparent px-6 py-5">
          <div className="aurora-blob -right-10 -top-16 h-40 w-40 bg-primary/25 animate-aurora" />
          <button onClick={onClose} className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
          <div className="relative flex items-center gap-2 text-primary">
            <Layers className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">
              New {kind} template{groupId ? " · shared" : ""}
            </span>
          </div>
          <h2 className="relative mt-2 font-display text-xl font-bold tracking-tight">
            Save recurring {kind === "expense" ? "expenses" : "income"}
          </h2>
          <p className="relative mt-1 text-sm text-muted-foreground">
            Add the fixed line items you repeat every month, then apply them in one tap.
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Template name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={kind === "expense" ? "e.g. Monthly fixed bills" : "e.g. Salary & rent income"}
              className="shadow-soft"
              autoFocus
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Line items</label>
              <span className="text-xs text-muted-foreground">{items.length} valid</span>
            </div>
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2">
                <Input
                  value={r.category}
                  onChange={(e) => setRow(i, { category: e.target.value })}
                  placeholder="Category"
                  className="h-9 text-sm shadow-soft"
                />
                <Input
                  value={r.name}
                  onChange={(e) => setRow(i, { name: e.target.value })}
                  placeholder={cfg.nameLabel}
                  className="h-9 text-sm shadow-soft"
                />
                <Input
                  value={r.amount}
                  onChange={(e) => setRow(i, { amount: e.target.value.replace(/[^\d.]/g, "") })}
                  inputMode="decimal"
                  placeholder="0"
                  className="h-9 w-24 text-right text-sm shadow-soft"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(i)} disabled={rows.length === 1} className="h-9 w-9 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addRow} className="w-full">
              <Plus className="h-3.5 w-3.5" />
              Add line item
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!canSave} className="glow-primary">
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save template
          </Button>
        </div>
      </div>
    </div>
  );
}
