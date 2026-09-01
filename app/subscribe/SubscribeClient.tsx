"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, Crown, Instagram, Sparkles } from "lucide-react";
import type { SubscriptionPlan } from "@prisma/client";
import { formatTugrug } from "@/lib/plans";

type PlanView = {
  plan: SubscriptionPlan;
  label: string;
  price: number;
  days: number;
  perDay: number;
};

/** Where readers send payment until QPay is wired up. */
const BANK = {
  name: "Худалдаа хөгжлийн банк",
  account: "MN510004000820031706",
  holder: "Гантөмөр Алтанзаяа",
};

const INSTAGRAM_HANDLE = "yume_orchuulagch";

export function SubscribeClient({
  plans,
  initialPlan,
  isPremium,
  premiumUntilLabel,
  accountEmail,
}: {
  plans: PlanView[];
  initialPlan: SubscriptionPlan;
  isPremium: boolean;
  premiumUntilLabel: string | null;
  /** The reader's own address; null when signed out. */
  accountEmail: string | null;
}) {
  const [selected, setSelected] = useState<SubscriptionPlan>(initialPlan);

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

      {/*
        Manual bank transfer. QPay is not wired up yet, so readers pay into the
        account below and message the receipt on Instagram; an admin then grants
        access by hand. The steps mirror the wording the owner uses there.
      */}
      <section
        className="mt-8 rounded-3xl border p-6 sm:p-8"
        style={{
          borderColor: "var(--home-line-strong)",
          background: "var(--home-paper)",
          boxShadow: "0 22px 48px -30px var(--home-shadow-strong)",
        }}
      >
        <h2
          className="flex items-center gap-2 text-2xl font-bold italic"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--home-plum)" }}
        >
          <Crown size={19} style={{ color: "var(--home-gold)" }} />
          Эрх авах
        </h2>

        <ol className="mt-6 flex flex-col gap-6">
          <li className="flex gap-4">
            <StepNumber n={1} />
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-6" style={{ color: "var(--home-plum)" }}>
                Доорх данс руу төлбөрөө шилжүүлнэ
                {selectedPlan ? (
                  <>
                    {" — "}
                    <strong style={{ color: "var(--home-rose-deep)" }}>
                      {formatTugrug(selectedPlan.price)}
                    </strong>{" "}
                    <span style={{ color: "var(--home-plum-soft)" }}>
                      ({selectedPlan.label})
                    </span>
                  </>
                ) : null}
              </p>
              <BankDetails />
            </div>
          </li>

          <li className="flex gap-4">
            <StepNumber n={2} />
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-6" style={{ color: "var(--home-plum)" }}>
                Инстаграм{" "}
                <a
                  href={`https://instagram.com/${INSTAGRAM_HANDLE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold"
                  style={{ color: "var(--home-rose-deep)" }}
                >
                  <Instagram size={14} />@{INSTAGRAM_HANDLE}
                </a>{" "}
                руу чатаар холбогдож бүртгэлтэй мэйл хаяг, шилжүүлгийн баримтаа
                илгээнэ үү.
              </p>
              <AccountAddress email={accountEmail} />
            </div>
          </li>

          <li className="flex gap-4">
            <StepNumber n={3} />
            <p className="flex-1 text-sm leading-6" style={{ color: "var(--home-plum)" }}>
              Юүмэ төд удалгүй админ эрх олгох болно💞
            </p>
          </li>
        </ol>

        <p
          className="mt-7 border-t pt-5 text-center text-sm font-semibold"
          style={{ borderColor: "var(--home-line)", color: "var(--home-plum)" }}
        >
          Бүртгүүлсэнд баярлалаа❣️
        </p>
      </section>
    </div>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
      style={{
        background:
          "linear-gradient(135deg, var(--home-rose) 0%, var(--home-rose-deep) 100%)",
      }}
    >
      {n}
    </span>
  );
}

/**
 * Copy-to-clipboard button. Shared by the bank account number and the reader's
 * own address so the two behave identically.
 */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context, or permission denied) — the value
      // is on screen to copy by hand, so there is nothing to recover from.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`${label} хуулах`}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition"
      style={{
        borderColor: copied ? "var(--home-rose)" : "var(--home-line-strong)",
        color: copied ? "var(--home-rose-deep)" : "var(--home-plum-soft)",
        background: "var(--home-paper)",
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Хуулагдлаа" : "Хуулах"}
    </button>
  );
}

/**
 * The address the admin's grant form looks the reader up by. Shown because the
 * step above asks them to send it, and a reader who signed in with Facebook or
 * Google has no reliable way to know which address that is.
 */
function AccountAddress({ email }: { email: string | null }) {
  if (!email) {
    return (
      <p
        className="mt-3 rounded-xl border px-3 py-2.5 text-xs leading-5"
        style={{
          borderColor: "var(--home-line)",
          background: "var(--home-paper-2)",
          color: "var(--home-plum-soft)",
        }}
      >
        <Link
          href="/sign-in"
          className="font-semibold"
          style={{ color: "var(--home-rose-deep)" }}
        >
          Нэвтэрч орвол
        </Link>{" "}
        бүртгэлтэй хаягаа эндээс хараад хуулж авах боломжтой.
      </p>
    );
  }

  return (
    <div
      className="mt-3 rounded-xl border p-3"
      style={{
        borderColor: "var(--home-line)",
        background: "var(--home-paper-2)",
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.24em]"
        style={{ color: "var(--home-gold)" }}
      >
        Таны бүртгэлтэй хаяг
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span
          className="min-w-0 break-all text-sm font-semibold"
          style={{ color: "var(--home-plum)" }}
        >
          {email}
        </span>
        <CopyButton value={email} label="Бүртгэлтэй хаяг" />
      </div>
    </div>
  );
}

function BankDetails() {
  return (
    <div
      className="mt-4 rounded-2xl border p-4"
      style={{
        borderColor: "var(--home-line)",
        background: "color-mix(in srgb, var(--home-gold) 8%, var(--home-paper-2))",
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.24em]"
        style={{ color: "var(--home-gold)" }}
      >
        Дансны мэдээлэл
      </p>

      <p className="mt-3 text-sm font-semibold" style={{ color: "var(--home-plum)" }}>
        {BANK.name}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <code
          className="text-base font-bold tracking-wide"
          style={{ fontFamily: "var(--font-mono)", color: "var(--home-plum)" }}
        >
          {BANK.account}
        </code>
        <CopyButton value={BANK.account} label="Дансны дугаар" />
      </div>

      <p className="mt-2 text-sm" style={{ color: "var(--home-plum-soft)" }}>
        {BANK.holder}
      </p>
    </div>
  );
}
