// src/lib/queries.ts
// React Query data layer. All Supabase server-state access + optimistic
// mutations live here, replacing the hand-rolled Zustand CRUD store.
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { expensesApi, incomeApi, userSettingsApi } from "./api";
import type { TxKind } from "@/lib/transaction-ui";
import type {
  Currency,
  ExpenseFormValues,
  IncomeFormValues,
  Transaction,
  UserSettings,
} from "@/types";

type FormValues = ExpenseFormValues | IncomeFormValues;

const SETTINGS_KEY = ["settings"] as const;
const keyFor = (kind: TxKind) => [kind] as const;

function listApi(kind: TxKind) {
  return kind === "expense" ? expensesApi : incomeApi;
}

function toPayload(values: FormValues) {
  return {
    category: values.category,
    name: values.name,
    amount: Number(values.amount),
    date: values.date,
  };
}

// ── Queries ──────────────────────────────────────────────────────────────────
export function useTransactions(kind: TxKind) {
  return useQuery({
    queryKey: keyFor(kind),
    queryFn: (): Promise<Transaction[]> => listApi(kind).getAll(),
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

// ── Mutations ────────────────────────────────────────────────────────────────
export function useAddTransaction(kind: TxKind) {
  const qc = useQueryClient();
  const key = keyFor(kind);

  return useMutation({
    mutationFn: (values: FormValues): Promise<Transaction> =>
      listApi(kind).create(toPayload(values)),
    onMutate: async (values) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Transaction[]>(key) ?? [];
      const tempId = -Date.now();
      const optimistic: Transaction = {
        id: tempId,
        user_id: "",
        created_at: new Date().toISOString(),
        ...toPayload(values),
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

export function useUpdateTransaction(kind: TxKind) {
  const qc = useQueryClient();
  const key = keyFor(kind);

  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: FormValues }): Promise<Transaction> =>
      listApi(kind).update(id, toPayload(values)),
    onMutate: async ({ id, values }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Transaction[]>(key) ?? [];
      qc.setQueryData<Transaction[]>(
        key,
        prev.map((t) => (t.id === id ? { ...t, ...toPayload(values) } : t))
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

export function useDeleteTransaction(kind: TxKind) {
  const qc = useQueryClient();
  const key = keyFor(kind);

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

export function useRenameCategory(kind: TxKind) {
  const qc = useQueryClient();
  const key = keyFor(kind);
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
