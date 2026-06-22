"use client";

import {
  AlertTriangle,
  ArrowRight,
  Check,
  Lightbulb,
  PieChart,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark, BrandLockup } from "@/components/brand-mark";
import { TIERS } from "@/lib/pricing";
import { cn } from "@/lib/utils";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: PieChart,
    title: "Categorical tracking",
    body: "Every expense and income source, sorted into categories you control. See exactly where your money goes at a glance.",
  },
  {
    icon: Lightbulb,
    title: "AI recommendations",
    body: "Expensio AI studies your habits and tells you precisely where to cut to hit your savings goals — in plain language.",
  },
  {
    icon: AlertTriangle,
    title: "Overspend warnings",
    body: "Catch category spikes and budget blowouts the moment they happen, not at the end of the month when it's too late.",
  },
  {
    icon: TrendingUp,
    title: "Forecasts & analytics",
    body: "Burn-rate projections and 6-month cash-flow trends show where you're headed before you get there.",
  },
];

const SAMPLE_INSIGHTS = [
  { tone: "warning", icon: AlertTriangle, color: "text-amber-400 bg-amber-500/12 ring-amber-500/20", title: "Dining up 64% vs last month", meta: "+64%" },
  { tone: "danger", icon: AlertTriangle, color: "text-rose-400 bg-rose-500/12 ring-rose-500/20", title: "Spending exceeds income", meta: "-820 MAD" },
  { tone: "rec", icon: Lightbulb, color: "text-primary bg-primary/12 ring-primary/20", title: "Cap groceries to save ~420 MAD", meta: "32%" },
  { tone: "good", icon: TrendingUp, color: "text-emerald-400 bg-emerald-500/12 ring-emerald-500/20", title: "Savings rate is healthy", meta: "+24%" },
];

interface LandingPageProps {
  onSignInGoogle: () => void;
  onDemo: () => void;
  error?: string | null;
}

export function LandingPage({ onSignInGoogle, onDemo, error }: LandingPageProps) {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* ── Ambient background ─────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="aurora-blob left-[8%] top-[-6%] h-[28rem] w-[28rem] bg-primary/20 animate-aurora" />
        <div className="aurora-blob right-[2%] top-[14%] h-[22rem] w-[22rem] bg-cyan-500/10 animate-aurora [animation-delay:-6s]" />
        <div className="aurora-blob bottom-[6%] left-[30%] h-[24rem] w-[24rem] bg-emerald-500/10 animate-aurora [animation-delay:-12s]" />
      </div>

      {/* ── Nav ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <BrandLockup />
          <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#ai" className="transition-colors hover:text-foreground">Expensio AI</a>
            <a href="#pricing" className="transition-colors hover:text-foreground">Pricing</a>
          </div>
          <Button onClick={onSignInGoogle} size="sm" className="font-semibold">
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Button>
        </nav>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative mx-auto w-full max-w-6xl px-5 pb-20 pt-16 sm:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div
              className="reveal inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
              style={{ "--d": "0ms" } as React.CSSProperties}
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI-powered expense intelligence
            </div>

            <h1
              className="reveal mt-6 font-display text-5xl font-extrabold leading-[1.02] tracking-tight text-balance sm:text-6xl"
              style={{ "--d": "80ms" } as React.CSSProperties}
            >
              Money clarity,
              <br />
              <span className="text-gradient text-glow">on autopilot.</span>
            </h1>

            <p
              className="reveal mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
              style={{ "--d": "160ms" } as React.CSSProperties}
            >
              Expensio tracks every dirham by category, then puts an AI analyst on
              your spending — flagging overspends, spotting savings, and forecasting
              your month before it ends.
            </p>

            <div
              className="reveal mt-8 flex flex-col gap-3 sm:flex-row"
              style={{ "--d": "240ms" } as React.CSSProperties}
            >
              <Button onClick={onSignInGoogle} size="lg" className="h-12 px-6 text-sm font-semibold glow-primary">
                <GoogleIcon className="h-5 w-5" />
                Start free with Google
              </Button>
              <Button onClick={onDemo} variant="outline" size="lg" className="h-12 px-6 text-sm font-semibold">
                <Zap className="h-4 w-4" />
                Try the live demo
              </Button>
            </div>

            <div
              className="reveal mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground"
              style={{ "--d": "320ms" } as React.CSSProperties}
            >
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Free forever plan</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> No card required</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Private &amp; secure</span>
            </div>

            {error && (
              <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          {/* Product mock */}
          <HeroMock />
        </div>
      </section>

      {/* ── Logo / category marquee ───────────────────────────────────── */}
      <section className="relative border-y border-border/50 bg-card/30 py-5">
        <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Tracks every corner of your budget
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
          <div className="flex w-max animate-marquee gap-3">
            {[...CATEGORIES, ...CATEGORIES].map((c, i) => (
              <span
                key={i}
                className="whitespace-nowrap rounded-full border border-border bg-secondary/40 px-4 py-1.5 text-sm text-muted-foreground"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section id="features" className="mx-auto w-full max-w-6xl px-5 py-24">
        <SectionHeading
          eyebrow="Everything in one place"
          title="A tracker that actually thinks"
          subtitle="Not just a spreadsheet with charts. Expensio reads your data and tells you what to do next."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="reveal group rounded-2xl border border-border bg-card/60 p-5 transition-smooth hover:-translate-y-1 hover:border-primary/30"
              style={{ "--d": `${i * 90}ms` } as React.CSSProperties}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20 transition-transform group-hover:scale-110">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-base font-bold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI showcase ───────────────────────────────────────────────── */}
      <section id="ai" className="relative border-y border-border/50 bg-card/20 py-24">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Meet Expensio AI
            </div>
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
              Your personal financial analyst, always on.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Every time you log a transaction, Expensio AI re-reads your whole
              month — comparing against history, projecting where you'll land, and
              surfacing the one move that matters most.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Month-over-month category spike detection",
                "Burn-rate forecasting before you overspend",
                "Concentration & savings-rate coaching",
              ].map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-foreground/90">{p}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* live insight feed mock */}
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary/5 blur-2xl" />
            <div className="rounded-2xl border border-border bg-card p-5 shadow-medium">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
                  <Sparkles className="h-[1.05rem] w-[1.05rem]" />
                </span>
                <div>
                  <p className="font-display text-sm font-bold leading-none">Expensio AI</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
                    Live analysis · June
                  </p>
                </div>
              </div>
              <div className="space-y-2.5">
                {SAMPLE_INSIGHTS.map((s, i) => (
                  <div
                    key={i}
                    className="reveal flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3"
                    style={{ "--d": `${i * 120}ms` } as React.CSSProperties}
                  >
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1", s.color)}>
                      <s.icon className="h-4 w-4" />
                    </span>
                    <p className="flex-1 text-sm font-medium">{s.title}</p>
                    <span className={cn("rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold tabular", s.color)}>
                      {s.meta}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────── */}
      <section id="pricing" className="mx-auto w-full max-w-5xl px-5 py-24">
        <SectionHeading
          eyebrow="Simple pricing"
          title="Start free. Upgrade when it pays for itself."
          subtitle="Pro costs less than one impulse coffee run a month — and usually saves you many."
        />
        <div className="mt-12 grid items-start gap-5 md:grid-cols-2">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                "relative rounded-2xl border p-6",
                tier.highlight
                  ? "border-primary/40 bg-card glow-primary"
                  : "border-border bg-card/60"
              )}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-lg font-bold tracking-tight">{tier.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{tier.tagline}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-4xl font-extrabold tabular tracking-tight">${tier.price}</span>
                <span className="text-sm text-muted-foreground">{tier.cadence}</span>
              </div>
              <Button
                onClick={onSignInGoogle}
                variant={tier.highlight ? "default" : "outline"}
                className={cn("mt-5 w-full font-semibold", tier.highlight && "glow-primary")}
              >
                {tier.id === "pro" ? <Zap className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
                {tier.id === "pro" ? "Start free trial" : "Get started free"}
              </Button>
              <ul className="mt-6 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className={cn("mt-0.5 h-4 w-4 shrink-0", tier.highlight ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA band ──────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-10 text-center sm:p-14">
          <div className="aurora-blob left-1/2 top-[-30%] h-64 w-64 -translate-x-1/2 bg-primary/25 animate-aurora" />
          <BrandMark className="relative mx-auto h-12 w-12" />
          <h2 className="relative mt-5 font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Take control of your money this month.
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-muted-foreground">
            Join in seconds. No card, no setup — just clarity.
          </p>
          <div className="relative mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button onClick={onSignInGoogle} size="lg" className="h-12 px-7 font-semibold glow-primary">
              <GoogleIcon className="h-5 w-5" />
              Start free with Google
            </Button>
            <Button onClick={onDemo} variant="outline" size="lg" className="h-12 px-7 font-semibold">
              Try the demo
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/50">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <BrandLockup />
          <p>© {new Date().getFullYear()} Expensio. Money clarity, on autopilot.</p>
        </div>
      </footer>
    </div>
  );
}

const CATEGORIES = [
  "Groceries", "Rent", "Dining", "Transport", "Bills", "Entertainment",
  "Health", "Shopping", "Salary", "Freelance", "Savings", "Travel",
];

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">{title}</h2>
      <p className="mt-3 text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function HeroMock() {
  return (
    <div
      className="reveal relative animate-float"
      style={{ "--d": "300ms" } as React.CSSProperties}
    >
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-primary/10 blur-3xl" />
      <div className="rounded-2xl border border-border bg-card/80 p-5 shadow-medium backdrop-blur-xl">
        {/* balance header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Balance · June</p>
            <p className="mt-1.5 font-display text-3xl font-extrabold tabular tracking-tight">
              12,480 <span className="text-base font-semibold text-muted-foreground">MAD</span>
            </p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
            <TrendingUp className="h-3.5 w-3.5" /> +24%
          </span>
        </div>

        {/* mini stats */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
            <p className="text-xs text-muted-foreground">Income</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular text-emerald-400">18,200</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
            <p className="text-xs text-muted-foreground">Expenses</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular text-rose-400">5,720</p>
          </div>
        </div>

        {/* category bars */}
        <div className="mt-4 space-y-2.5">
          {[
            { label: "Groceries", pct: 32, color: "bg-primary" },
            { label: "Rent", pct: 26, color: "bg-cyan-400" },
            { label: "Dining", pct: 18, color: "bg-amber-400" },
            { label: "Transport", pct: 12, color: "bg-rose-400" },
          ].map((c) => (
            <div key={c.label} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs text-muted-foreground">{c.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <div className={cn("h-full rounded-full", c.color)} style={{ width: `${c.pct}%` }} />
              </div>
              <span className="w-9 shrink-0 text-right font-mono text-xs tabular text-muted-foreground">{c.pct}%</span>
            </div>
          ))}
        </div>

        {/* AI insight chip */}
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/8 p-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <p className="text-xs text-foreground/90">
            <span className="font-semibold">AI:</span> Cut dining by 420 MAD to hit your savings goal.
          </p>
        </div>
      </div>
    </div>
  );
}
