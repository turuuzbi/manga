"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Crown, Loader2, Sparkles } from "lucide-react";
import type { SubscriptionPlan } from "@prisma/client";
import { formatTugrug } from "@/lib/plans";
import { startCheckoutAction, type CheckoutState } from "@/app/subscribe/actions";

type PlanView = {
  plan: SubscriptionPlan;
  label: string;
  price: number;
  days: number;
  perDay: number;
};

export function SubscribeClient({
  plans,
  initialPlan,
  isPremium,
  premiumUntilLabel,
}: {
  plans: PlanView[];
  initialPlan: SubscriptionPlan;
  isPremium: boolean;
  premiumUntilLabel: string | null;
}) {
  const [selected, setSelected] = useState<SubscriptionPlan>(initialPlan);
  const [result, setResult] = useState<CheckoutState | null>(null);
  const [isPending, startTransition] = useTransition();

  function checkout() {
    setResult(null);
    startTransition(async () => {
      setResult(await startCheckoutAction(selected));
    });
  }

  const selectedPlan = plans.find((entry) => entry.plan === selected) ?? plans[0];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-8 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition"
        style={{ color: "var(--home-plum-soft)" }}
      >
        <ArrowLeft size={15} />
        Нүүр
      </Link>

      <header className="mt-6 text-center">
        <p
          className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em]"
          style={{ color: "var(--home-gold)" }}
        >
          <Sparkles size={13} />
          Yume Premium
        </p>
        <h1
          className="mt-3 text-3xl font-bold italic sm:text-4xl"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--home-plum)" }}
        >
          Хязгааргүй унших багц
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6" style={{ color: "var(--home-plum-soft)" }}>
          Багц авснаар бүх бүлгийг хязгааргүй уншина. Үгүй бол өдөрт 3 бүлэг үнэгүй.
        </p>
      </header>

      {isPremium ? (
        <div
          className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold"
          style={{
            borderColor: "var(--home-line-strong)",
            background: "color-mix(in srgb, var(--home-gold) 12%, transparent)",
            color: "var(--home-plum)",
          }}
        >
          <Crown size={16} style={{ color: "var(--home-gold)" }} />
          Таны багц идэвхтэй{premiumUntilLabel ? ` — ${premiumUntilLabel} хүртэл` : ""}. Сунгаж болно.
        </div>
      ) : null}

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {plans.map((entry) => {
          const active = entry.plan === selected;

          return (
            <button
              key={entry.plan}
              type="button"
              onClick={() => setSelected(entry.plan)}
              className="relative rounded-2xl border p-5 text-left transition"
              style={{
                borderColor: active ? "var(--home-rose)" : "var(--home-line)",
                background: active
                  ? "color-mix(in srgb, var(--home-rose) 12%, var(--home-paper))"
                  : "var(--home-paper)",
                boxShadow: active
                  ? "0 14px 32px -18px var(--home-shadow-strong)"
                  : "none",
              }}
            >
              {active ? (
                <span
                  className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full text-white"
                  style={{ background: "var(--home-rose-deep)" }}
                >
                  <Check size={14} />
                </span>
              ) : null}
              <p
                className="text-xs font-semibold uppercase tracking-[0.18em]"
                style={{ color: "var(--home-gold)" }}
              >
                {entry.label}
              </p>
              <p
                className="mt-2 text-2xl font-bold"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--home-plum)" }}
              >
                {formatTugrug(entry.price)}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--home-plum-soft)" }}>
                {entry.days} хоног · ≈ {formatTugrug(entry.perDay)}/өдөр
              </p>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={checkout}
        disabled={isPending}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white transition disabled:opacity-70"
        style={{
          background: "linear-gradient(135deg, var(--home-rose) 0%, var(--home-rose-deep) 100%)",
          boxShadow: "0 16px 34px -14px var(--home-rose-deep)",
        }}
      >
        {isPending ? <Loader2 size={17} className="animate-spin" /> : <Crown size={17} />}
        {selectedPlan
          ? `${selectedPlan.label} — ${formatTugrug(selectedPlan.price)} төлөх`
          : "Багц авах"}
      </button>

      {result ? (
        <div
          className="mt-5 rounded-2xl border p-5 text-center"
          style={{
            borderColor: result.ok ? "var(--home-line-strong)" : "#c44d66",
            background: "var(--home-paper)",
            color: "var(--home-plum)",
          }}
        >
          {result.pending ? (
            <p className="text-sm font-semibold" style={{ color: "var(--home-plum)" }}>
              ⏳ {result.message}
            </p>
          ) : (
            <p className="text-sm" style={{ color: result.ok ? "var(--home-plum)" : "#c44d66" }}>
              {result.message}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
