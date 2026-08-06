// Minimal RFC-4180 CSV serialize/parse for transaction import & export.
// Columns: category, name, amount, date (header row required on import,
// any column order, case-insensitive).

import type { Transaction } from "@/types";

export interface CsvRow {
  category: string;
  name: string;
  amount: number;
  date: string;
}

export interface ParseResult {
  rows: CsvRow[];
  /** Human-readable problems, one per bad line. Empty = clean parse. */
  errors: string[];
}

const COLUMNS = ["category", "name", "amount", "date"] as const;
const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function escapeField(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function transactionsToCsv(items: Transaction[]): string {
  const lines = [COLUMNS.join(",")];
  for (const t of items) {
    lines.push(
      [escapeField(t.category), escapeField(t.name), String(t.amount), t.date].join(",")
    );
  }
  return lines.join("\r\n") + "\r\n";
}

/** Split CSV text into records of fields, honoring quoted fields. */
function splitCsv(text: string): string[][] {
  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;

  const push = () => {
    record.push(field);
    field = "";
  };
  const endRecord = () => {
    push();
    // Skip fully blank lines.
    if (record.length > 1 || record[0].trim() !== "") records.push(record);
    record = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      push();
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      endRecord();
    } else {
      field += c;
    }
  }
  if (field !== "" || record.length > 0) endRecord();
  return records;
}

export function parseTransactionsCsv(text: string): ParseResult {
  const records = splitCsv(text);
  if (records.length === 0) return { rows: [], errors: ["The file is empty."] };

  const header = records[0].map((h) => h.trim().toLowerCase());
  const index: Partial<Record<(typeof COLUMNS)[number], number>> = {};
  for (const col of COLUMNS) {
    const at = header.indexOf(col);
    if (at === -1) {
      return {
        rows: [],
        errors: [`Missing "${col}" column — the header row must contain: ${COLUMNS.join(", ")}.`],
      };
    }
    index[col] = at;
  }

  const rows: CsvRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < records.length; i++) {
    const rec = records[i];
    const line = i + 1;
    const category = (rec[index.category!] ?? "").trim();
    const name = (rec[index.name!] ?? "").trim();
    const amount = (rec[index.amount!] ?? "").trim();
    const date = (rec[index.date!] ?? "").trim();

    if (!category) errors.push(`Line ${line}: category is empty.`);
    else if (!name) errors.push(`Line ${line}: name is empty.`);
    else if (name.length > 50) errors.push(`Line ${line}: name is longer than 50 characters.`);
    else if (!AMOUNT_RE.test(amount) || Number(amount) <= 0)
      errors.push(`Line ${line}: "${amount}" is not a valid amount.`);
    else if (!DATE_RE.test(date) || isNaN(Date.parse(date)))
      errors.push(`Line ${line}: "${date}" is not a valid date (expected YYYY-MM-DD).`);
    else rows.push({ category, name, amount: Number(amount), date });
  }

  return { rows, errors };
}
