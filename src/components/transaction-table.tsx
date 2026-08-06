"use client";

import { useMemo, useState } from "react";
import { Check, Inbox, Loader2, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MemberAvatar } from "@/components/member-avatar";
import { cn } from "@/lib/utils";
import {
  useCurrency,
  useDeleteTransaction,
  useGroupTransactions,
  useTransactions,
  useUpdateTransaction,
} from "@/lib/queries";
import { useCurrentMonth } from "@/hooks/use-derived";
import { TX_CONFIG, formatCategory, type TxKind } from "@/lib/transaction-ui";
import { memberLabel } from "@/lib/member-ui";
import type { GroupMember, Transaction } from "@/types";

interface EditValues {
  category: string;
  name: string;
  amount: string;
  date: string;
}

const EMPTY_EDIT: EditValues = { category: "", name: "", amount: "", date: "" };

export function TransactionTable({
  kind,
  groupId = null,
  members,
  currentUserId,
}: {
  kind: TxKind;
  groupId?: string | null;
  /** For family scope: member identity by user id. */
  members?: Map<string, GroupMember>;
  currentUserId?: string | null;
}) {
  const cfg = TX_CONFIG[kind];
  const isExpense = kind === "expense";
  const isGroup = !!groupId;

  const month = useCurrentMonth();
  const currency = useCurrency();
  const personal = useTransactions(kind);
  const group = useGroupTransactions(kind, groupId);
  const source = isGroup ? group : personal;
  const isLoading = source.isLoading;

  const items = useMemo(
    () => (source.data ?? []).filter((t) => t.date?.startsWith(month)),
    [source.data, month]
  );
  const total = useMemo(() => items.reduce((s, t) => s + Number(t.amount), 0), [items]);

  const del = useDeleteTransaction(kind, groupId);
  const upd = useUpdateTransaction(kind, groupId);
  const busy = isLoading || del.isPending || upd.isPending;

  const allCategories = [
    ...new Set([...cfg.defaultCategories, ...items.map((i) => i.category)]),
  ];

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<EditValues>(EMPTY_EDIT);

  const canEdit = (t: Transaction) => !isGroup || t.user_id === currentUserId;

  const startEditing = (item: Transaction) => {
    if (!item.id) return;
    setEditingId(item.id);
    setEditValues({
      category: item.category,
      name: item.name,
      amount: String(item.amount),
      date: item.date ? item.date.split("T")[0] : new Date().toISOString().split("T")[0],
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues(EMPTY_EDIT);
  };

  const saveEdit = async () => {
    if (!editingId || !editValues.name || !editValues.amount || !editValues.category) return;
    await upd.mutateAsync({ id: editingId, values: editValues });
    cancelEditing();
  };

  const formatDate = (date: string) =>
    date
      ? new Date(date).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";

  const labelFor = (userId: string) =>
    memberLabel(members?.get(userId)?.profile ?? null, "Member");

  return (
    <Card className="overflow-hidden shadow-soft">
      {isLoading && (
        <div className="flex items-center justify-center gap-2 border-b bg-muted/20 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      )}

      {items.length === 0 && !isLoading ? (
        <div className="px-6 py-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Inbox className="h-6 w-6" />
          </div>
          <h3 className="font-semibold">{cfg.emptyTitle}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {isGroup
              ? `Shared ${kind} added here is visible to everyone in this group.`
              : cfg.emptyHint}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {isGroup && <TableHead className="w-[18%]">Member</TableHead>}
                <TableHead className="w-[20%]">Category</TableHead>
                <TableHead className="w-[24%]">{cfg.nameColumn}</TableHead>
                <TableHead className="w-[16%]">Date</TableHead>
                <TableHead className="w-[16%] text-right">Amount</TableHead>
                <TableHead className="w-[14%] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) =>
                editingId === item.id ? (
                  <TableRow key={item.id}>
                    {isGroup && (
                      <TableCell>
                        <MemberBadge label={labelFor(item.user_id)} userId={item.user_id} members={members} />
                      </TableCell>
                    )}
                    <TableCell>
                      <Select
                        value={editValues.category}
                        onValueChange={(val) => setEditValues((p) => ({ ...p, category: val }))}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {allCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {formatCategory(cat)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={editValues.name}
                        onChange={(e) => setEditValues((p) => ({ ...p, name: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={editValues.date}
                        onChange={(e) => setEditValues((p) => ({ ...p, date: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={editValues.amount}
                        onChange={(e) => setEditValues((p) => ({ ...p, amount: e.target.value }))}
                        className="h-8 text-right text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button size="icon" onClick={saveEdit} disabled={busy} className="h-8 w-8">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="outline" onClick={cancelEditing} className="h-8 w-8">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={item.id} className="transition-colors">
                    {isGroup && (
                      <TableCell>
                        <MemberBadge label={labelFor(item.user_id)} userId={item.user_id} members={members} />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", cfg.dotClass)} />
                        {formatCategory(item.category)}
                      </div>
                    </TableCell>
                    <TableCell>{formatCategory(item.name)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(item.date)}</TableCell>
                    <TableCell className={cn("text-right font-mono font-semibold tabular", cfg.amountClass)}>
                      {item.amount.toLocaleString()} {currency}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {canEdit(item) ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditing(item)}
                              disabled={busy}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => item.id && del.mutate(item.id)}
                              disabled={busy}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )}

              <TableRow className="border-t-2 bg-muted/30 hover:bg-muted/30">
                <TableCell colSpan={isGroup ? 4 : 3} className="font-display text-base font-bold">
                  {cfg.totalLabel}
                </TableCell>
                <TableCell className={cn("text-right font-mono text-base font-bold tabular", cfg.amountClass)}>
                  {total.toLocaleString()} {currency}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}

function MemberBadge({
  label,
  userId,
  members,
}: {
  label: string;
  userId: string;
  members?: Map<string, GroupMember>;
}) {
  return (
    <div className="flex items-center gap-2">
      <MemberAvatar id={userId} label={label} avatarUrl={members?.get(userId)?.profile?.avatar_url} size={24} />
      <span className="truncate text-sm">{label}</span>
    </div>
  );
}
