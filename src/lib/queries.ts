// src/lib/queries.ts
// React Query data layer. All Supabase server-state access + optimistic
// mutations live here.
//
// Scope model: every transaction hook takes an optional `groupId`.
//   groupId == null  → personal budget  (cache key [kind])
//   groupId == "…"   → family budget     (cache key ["group-tx", kind, groupId])
// Personal and family caches are fully independent, so the two budgets never
// bleed into each other.
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { expensesApi, incomeApi, templatesApi, userSettingsApi } from "./api";
import type { TxKind } from "@/lib/transaction-ui";
import type {
  BudgetTemplate,
  Currency,
  ExpenseFormValues,
  IncomeFormValues,
  TemplateItem,
  Transaction,
  UserSettings,
} from "@/types";

type FormValues = ExpenseFormValues | IncomeFormValues;

const SETTINGS_KEY = ["settings"] as const;

/** Cache key for a kind + scope. Personal keeps the bare [kind] key. */
export function txKey(kind: TxKind, groupId?: string | null) {
  return (groupId ? ["group-tx", kind, groupId] : [kind]) as readonly unknown[];
}
const templatesKey = (kind: TxKind, groupId?: string | null) =>
  ["templates", kind, groupId ?? "personal"] as const;

function listApi(kind: TxKind) {
  return kind === "expense" ? expensesApi : incomeApi;
}

function toPayload(values: FormValues, groupId?: string | null) {
  return {
    category: values.category,
    name: values.name,
    amount: Number(values.amount),
    date: values.date,
    group_id: groupId ?? null,
  };
}

// ── Queries ──────────────────────────────────────────────────────────────────
/** Personal transactions of one kind. */
export function useTransactions(kind: TxKind) {
  return useQuery({
    queryKey: txKey(kind),
    queryFn: (): Promise<Transaction[]> => listApi(kind).getAll(),
  });
}

/** Shared (family) transactions of one kind for a group. Disabled when no group. */
export function useGroupTransactions(kind: TxKind, groupId: string | null) {
  return useQuery({
    queryKey: txKey(kind, groupId),
    queryFn: (): Promise<Transaction[]> => listApi(kind).getForGroup(groupId as string),
    enabled: !!groupId,
  });
}

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: () => userSettingsApi.get(),
  });
}

export function useCurrency(): Currency {
  return useSettings().data?.currency ?? "MAD";
}

// ── Transaction mutations (scoped by groupId) ─────────────────────────────────
export function useAddTransaction(kind: TxKind, groupId: string | null = null) {
  const qc = useQueryClient();
  const key = txKey(kind, groupId);

  return useMutation({
    mutationFn: (values: FormValues): Promise<Transaction> =>
      listApi(kind).create(toPayload(values, groupId)),
    onMutate: async (values) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Transaction[]>(key) ?? [];
      const tempId = -Date.now();
      const optimistic: Transaction = {
        id: tempId,
        user_id: "",
        created_at: new Date().toISOString(),
        ...toPayload(values, groupId),
      };
      qc.setQueryData<Transaction[]>(key, [optimistic, ...prev]);
      return { prev, tempId };
    },
    onSuccess: (created, _values, ctx) => {
      qc.setQueryData<Transaction[]>(key, (old = []) =>
        old.map((t) => (t.id === ctx.tempId ? created : t))
      );
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
  });
}

export function useUpdateTransaction(kind: TxKind, groupId: string | null = null) {
  const qc = useQueryClient();
  const key = txKey(kind, groupId);

  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: FormValues }): Promise<Transaction> =>
      listApi(kind).update(id, {
        category: values.category,
        name: values.name,
        amount: Number(values.amount),
        date: values.date,
      }),
    onMutate: async ({ id, values }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Transaction[]>(key) ?? [];
      qc.setQueryData<Transaction[]>(
        key,
        prev.map((t) => (t.id === id ? { ...t, ...toPayload(values, t.group_id) } : t))
      );
      return { prev };
    },
    onSuccess: (updated) => {
      qc.setQueryData<Transaction[]>(key, (old = []) =>
        old.map((t) => (t.id === updated.id ? updated : t))
      );
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
  });
}

export function useDeleteTransaction(kind: TxKind, groupId: string | null = null) {
  const qc = useQueryClient();
  const key = txKey(kind, groupId);

  return useMutation({
    mutationFn: (id: number): Promise<void> => listApi(kind).delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Transaction[]>(key) ?? [];
      qc.setQueryData<Transaction[]>(key, prev.filter((t) => t.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
  });
}

export function useRenameCategory(kind: TxKind, groupId: string | null = null) {
  const qc = useQueryClient();
  const key = txKey(kind, groupId);
  const api = listApi(kind);

  return useMutation({
    mutationFn: async ({ oldName, newName }: { oldName: string; newName: string }) => {
      const affected = (qc.getQueryData<Transaction[]>(key) ?? []).filter(
        (t) => t.category === oldName
      );
      await Promise.all(
        affected.map((t) =>
          api.update(t.id, {
            category: newName,
            name: t.name,
            amount: t.amount,
            date: t.date,
          })
        )
      );
    },
    onMutate: async ({ oldName, newName }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Transaction[]>(key) ?? [];
      qc.setQueryData<Transaction[]>(
        key,
        prev.map((t) => (t.category === oldName ? { ...t, category: newName } : t))
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
  });
}

// ── Templates ─────────────────────────────────────────────────────────────────
export function useTemplates(kind: TxKind, groupId: string | null = null) {
  return useQuery({
    queryKey: templatesKey(kind, groupId),
    queryFn: (): Promise<BudgetTemplate[]> => templatesApi.list(kind, groupId),
  });
}

export function useCreateTemplate(kind: TxKind, groupId: string | null = null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; items: TemplateItem[] }) =>
      templatesApi.create({ kind, groupId, name: input.name, items: input.items }),
    onSuccess: () => qc.invalidateQueries({ queryKey: templatesKey(kind, groupId) }),
  });
}

export function useDeleteTemplate(kind: TxKind, groupId: string | null = null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => templatesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: templatesKey(kind, groupId) }),
  });
}

/**
 * Apply a template to a month: inserts every line item as a transaction dated to
 * the first of that month, in one round-trip. Refreshes the scoped ledger.
 */
export function useApplyTemplate(kind: TxKind, groupId: string | null = null) {
  const qc = useQueryClient();
  const key = txKey(kind, groupId);

  return useMutation({
    mutationFn: ({ template, month }: { template: BudgetTemplate; month: string }) => {
      const date = `${month}-01`;
      const rows = template.items.map((it) => ({
        category: it.category,
        name: it.name,
        amount: Number(it.amount),
        date,
        group_id: groupId ?? null,
      }));
      return listApi(kind).createMany(rows);
    },
    onSuccess: (created) => {
      qc.setQueryData<Transaction[]>(key, (old = []) => [...created, ...old]);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

// ── Settings ──────────────────────────────────────────────────────────────────
export function useSetCurrency() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (currency: Currency) => userSettingsApi.upsert({ currency }),
    onMutate: async (currency) => {
      await qc.cancelQueries({ queryKey: SETTINGS_KEY });
      const prev = qc.getQueryData<UserSettings | null>(SETTINGS_KEY);
      qc.setQueryData<UserSettings | null>(SETTINGS_KEY, (old) =>
        old ? { ...old, currency } : ({ user_id: "", currency } as UserSettings)
      );
      return { prev };
    },
    onSuccess: (data) => qc.setQueryData(SETTINGS_KEY, data),
    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(SETTINGS_KEY, ctx.prev);
    },
  });
}
