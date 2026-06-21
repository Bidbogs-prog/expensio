// src/lib/pricing.ts — single source of truth for freemium tiers.

export interface Tier {
  id: "free" | "pro";
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}

export const TIERS: Tier[] = [
  {
    id: "free",
    name: "Starter",
    price: "0",
    cadence: "forever",
    tagline: "Everything you need to start tracking.",
    features: [
      "Unlimited expenses & income",
      "Category tracking & breakdowns",
      "2 AI insights per month",
      "2 months of history",
      "1 currency",
    ],
    cta: "Current plan",
  },
  {
    id: "pro",
    name: "Pro",
    price: "4",
    cadence: "/ month",
    tagline: "Your full financial co-pilot.",
    features: [
      "Everything in Starter",
      "Unlimited AI recommendations & warnings",
      "Spending trend & forecast analytics",
      "Unlimited history",
      "Burn-rate & overspend projections",
      "Multi-currency + CSV export",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    highlight: true,
  },
];

export const PRO_PERKS = [
  "Unlimited AI recommendations & warnings",
  "Spending trend & 30-day forecast",
  "Burn-rate overspend projections",
  "Unlimited history & CSV export",
];
