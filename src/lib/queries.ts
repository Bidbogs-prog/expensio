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
import { expensesApi, incomeApi, savingsApi, templatesApi, userSettingsApi } from "./api";
import type { NewSavingsContribution, NewSavingsGoal } from "./api";
import type { TxKind } from "@/lib/transaction-ui";
import type {
  BudgetTemplate,
  Currency,
  ExpenseFormValues,
  IncomeFormValues,
  SavingsContribution,
  SavingsGoal,
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

/**
 * Transactions of one kind for the active scope: the personal budget when
 * groupId is null, otherwise the given family group. Lets a component render
 * either budget's data from a single `groupId` prop.
 */
export function useScopedTransactions(kind: TxKind, groupId: string | null) {
  const personal = useTransactions(kind);
  const group = useGroupTransactions(kind, groupId);
  return groupId ? group : personal;
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

// ── Savings goals & contributions (personal-only) ─────────────────────────────
const GOALS_KEY = ["savings-goals"] as const;
const CONTRIBUTIONS_KEY = ["savings-contributions"] as const;

export function useSavingsGoals() {
  return useQuery({
    queryKey: GOALS_KEY,
    queryFn: (): Promise<SavingsGoal[]> => savingsApi.listGoals(),
  });
}

export function useSavingsContributions() {
  return useQuery({
    queryKey: CONTRIBUTIONS_KEY,
    queryFn: (): Promise<SavingsContribution[]> => savingsApi.listContributions(),
  });
}

export function useCreateSavingsGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (goal: NewSavingsGoal): Promise<SavingsGoal> => savingsApi.createGoal(goal),
    onSuccess: (created) => {
      qc.setQueryData<SavingsGoal[]>(GOALS_KEY, (old = []) => [...old, created]);
    },
  });
}

export function useUpdateSavingsGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<NewSavingsGoal> }) =>
      savingsApi.updateGoal(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: GOALS_KEY });
      const prev = qc.getQueryData<SavingsGoal[]>(GOALS_KEY) ?? [];
      qc.setQueryData<SavingsGoal[]>(
        GOALS_KEY,
        prev.map((g) => (g.id === id ? { ...g, ...patch } : g))
      );
      return { prev };
    },
    onSuccess: (updated) => {
      qc.setQueryData<SavingsGoal[]>(GOALS_KEY, (old = []) =>
        old.map((g) => (g.id === updated.id ? updated : g))
      );
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(GOALS_KEY, ctx.prev);
    },
  });
}

/** Deletes a goal AND its contribution history (DB cascades; caches mirror it). */
export function useDeleteSavingsGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string): Promise<void> => savingsApi.deleteGoal(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: GOALS_KEY });
      await qc.cancelQueries({ queryKey: CONTRIBUTIONS_KEY });
      const prevGoals = qc.getQueryData<SavingsGoal[]>(GOALS_KEY) ?? [];
      const prevContribs = qc.getQueryData<SavingsContribution[]>(CONTRIBUTIONS_KEY) ?? [];
      qc.setQueryData<SavingsGoal[]>(GOALS_KEY, prevGoals.filter((g) => g.id !== id));
      qc.setQueryData<SavingsContribution[]>(
        CONTRIBUTIONS_KEY,
        prevContribs.filter((c) => c.goal_id !== id)
      );
      return { prevGoals, prevContribs };
    },
    onError: (_e, _v, ctx) => {
      if (ctx) {
        qc.setQueryData(GOALS_KEY, ctx.prevGoals);
        qc.setQueryData(CONTRIBUTIONS_KEY, ctx.prevContribs);
      }
    },
  });
}

export function useAddSavingsContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewSavingsContribution): Promise<SavingsContribution> =>
      savingsApi.createContribution(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: CONTRIBUTIONS_KEY });
      const prev = qc.getQueryData<SavingsContribution[]>(CONTRIBUTIONS_KEY) ?? [];
      const tempId = -Date.now();
      const optimistic: SavingsContribution = {
        id: tempId,
        user_id: "",
        created_at: new Date().toISOString(),
        ...input,
      };
      qc.setQueryData<SavingsContribution[]>(CONTRIBUTIONS_KEY, [optimistic, ...prev]);
      return { prev, tempId };
    },
    onSuccess: (created, _v, ctx) => {
      qc.setQueryData<SavingsContribution[]>(CONTRIBUTIONS_KEY, (old = []) =>
        old.map((c) => (c.id === ctx.tempId ? created : c))
      );
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(CONTRIBUTIONS_KEY, ctx.prev);
    },
  });
}

export function useDeleteSavingsContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number): Promise<void> => savingsApi.deleteContribution(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: CONTRIBUTIONS_KEY });
      const prev = qc.getQueryData<SavingsContribution[]>(CONTRIBUTIONS_KEY) ?? [];
      qc.setQueryData<SavingsContribution[]>(CONTRIBUTIONS_KEY, prev.filter((c) => c.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(CONTRIBUTIONS_KEY, ctx.prev);
    },
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
