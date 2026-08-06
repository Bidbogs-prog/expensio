"use client";

// CSV export / import for the scoped ledger of one transaction kind.
// Export downloads every row in the current scope; import bulk-inserts
// validated rows into it.

import { useRef, useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useImportTransactions, useScopedTransactions } from "@/lib/queries";
import { parseTransactionsCsv, transactionsToCsv } from "@/lib/csv";
import { TX_CONFIG, type TxKind } from "@/lib/transaction-ui";

const MAX_SHOWN_ERRORS = 3;

export function CsvControls({
  kind,
  groupId = null,
}: {
  kind: TxKind;
  groupId?: string | null;
}) {
  const cfg = TX_CONFIG[kind];
  const { data: items = [] } = useScopedTransactions(kind, groupId);
  const importRows = useImportTransactions(kind, groupId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const exportCsv = () => {
    const scope = groupId ? "family" : "personal";
    const stamp = new Date().toISOString().slice(0, 10);
    const blob = new Blob([transactionsToCsv(items)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expensio-${kind}s-${scope}-${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (file: File) => {
    setStatus(null);
    const { rows, errors } = parseTransactionsCsv(await file.text());

    if (errors.length > 0) {
      const shown = errors.slice(0, MAX_SHOWN_ERRORS).join(" ");
      const more = errors.length > MAX_SHOWN_ERRORS ? ` (+${errors.length - MAX_SHOWN_ERRORS} more)` : "";
      setStatus({ tone: "error", text: `Nothing imported. ${shown}${more}` });
      return;
    }
    if (rows.length === 0) {
      setStatus({ tone: "error", text: "Nothing imported — the file has no data rows." });
      return;
    }

    importRows.mutate(
      rows.map((r) => ({ ...r, category: cfg.normalizeCategory(r.category) })),
      {
        onSuccess: (created) =>
          setStatus({ tone: "ok", text: `Imported ${created.length} ${kind} row${created.length === 1 ? "" : "s"}.` }),
        onError: (e) =>
          setStatus({ tone: "error", text: e instanceof Error ? e.message : "Import failed." }),
      }
    );
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {status && (
        <p
          role="status"
          className={
            status.tone === "ok"
              ? "mr-auto text-xs text-emerald-600 dark:text-emerald-400"
              : "mr-auto text-xs text-rose-600 dark:text-rose-400"
          }
        >
          {status.text}
        </p>
      )}
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        onClick={() => fileRef.current?.click()}
        disabled={importRows.isPending}
      >
        {importRows.isPending ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="mr-1.5 h-3.5 w-3.5" />
        )}
        Import CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        onClick={exportCsv}
        disabled={items.length === 0}
      >
        <Download className="mr-1.5 h-3.5 w-3.5" />
        Export CSV
      </Button>
    </div>
  );
}
