// Live exchange rates via open.er-api.com (free, no key, includes MAD).

import type { Currency } from "@/types";

export async function fetchRate(from: Currency, to: Currency): Promise<number> {
  const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
  if (!res.ok) throw new Error("Could not load exchange rates");
  const json = await res.json();
  const rate = json?.rates?.[to];
  if (json?.result !== "success" || typeof rate !== "number" || rate <= 0) {
    throw new Error("Exchange rate unavailable");
  }
  return rate;
}
