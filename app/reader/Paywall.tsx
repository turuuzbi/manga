import Link from "next/link";
import { Crown, Home, Lock } from "lucide-react";
import type { AccessReason } from "@/lib/reading-access";
import { PLANS, PLAN_ORDER, formatTugrug } from "@/lib/plans";

const REASON_COPY: Partial<Record<AccessReason, { title: string; body: string }>> = {
  quota_exhausted: {
    title: "Өнөөдрийн үнэгүй бүлгүүд дууслаа",
    body: "Та өнөөдөр 3 үнэгүй бүлгээ уншиж дууссан байна. Хязгааргүй унших бол багц авна уу — эсвэл маргааш дахин үнэгүй уншаарай.",
  },
  ip_claimed: {
    title: "Энэ сүлжээний үнэгүй бүлгүүд дууссан",
    body: "Энэ сүлжээнээс өнөөдрийн үнэгүй бүлгүүд аль хэдийн уншигдсан байна. Хязгааргүй унших бол багц авна уу.",
  },
};

const FALLBACK_COPY = {
  title: "Үргэлжлүүлэн унших",
  body: "Энэ бүлгийг унших бол багц авах эсвэл маргааш үнэгүй эрхээ ашиглана уу.",
};

export function Paywall({
  reason,
  manga,
  chapterNumber,
}: {
  reason: AccessReason;
  manga: { id: string; name: string };
  chapterNumber: number;
}) {
  const copy = REASON_COPY[reason] ?? FALLBACK_COPY;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050505] px-4 py-16 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(210,125,156,0.14),transparent_34%),radial-gradient(circle_at_bottom,rgba(200,162,76,0.08),transparent_30%)]" />

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/12 bg-white/5">
          <Lock size={26} className="text-[#e2b6cc]" />
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c9a24c]">
          {manga.name} · Бүлэг {chapterNumber}
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
          {copy.title}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-400">
          {copy.body}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3">
          {PLAN_ORDER.map((planKey) => {
            const plan = PLANS[planKey];
            const perDay = Math.round(plan.price / plan.days);

            return (
              <Link
                key={plan.plan}
                href={`/subscribe?plan=${plan.plan}`}
                className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-[#d27d9c]/60 hover:bg-white/[0.07]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                  {plan.label}
                </p>
                <p className="mt-1 text-lg font-bold text-white">
                  {formatTugrug(plan.price)}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  ≈ {formatTugrug(perDay)}/өдөр
                </p>
              </Link>
            );
          })}
        </div>

        <Link
          href={`/subscribe?plan=ONE_MONTH`}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#d27d9c] to-[#b9577b] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_-12px_rgba(185,87,123,0.8)] transition hover:brightness-110"
        >
          <Crown size={16} />
          Багц авах
        </Link>

        <div className="mt-6 flex items-center justify-center gap-5 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          <Link
            href={`/manga/${manga.id}`}
            className="transition hover:text-zinc-200"
          >
            Цувралын хуудас
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 transition hover:text-zinc-200"
          >
            <Home size={13} />
            Нүүр
          </Link>
        </div>
      </div>
    </div>
  );
}
