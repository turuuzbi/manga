"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Crown, Search, UserRound } from "lucide-react";
import { PLANS, PLAN_ORDER, formatTugrug } from "@/lib/plans";
import {
  grantSubscriptionAction,
  searchUsersAction,
  type AdminUserRow,
} from "@/app/admin/actions";

const SEARCH_DEBOUNCE_MS = 280;

/** Whole days left on a pass, or null when there is none / it has lapsed. */
function daysLeft(premiumUntil: string | null): number | null {
  if (!premiumUntil) {
    return null;
  }

  const msLeft = new Date(premiumUntil).getTime() - Date.now();

  return msLeft > 0 ? Math.ceil(msLeft / 86_400_000) : null;
}

/**
 * Find a reader and grant them a pass without knowing their address up front.
 *
 * The typed-email form above this panel only works when the reader can tell the
 * admin exactly which address their account uses — which someone who signed in
 * through Google or Facebook often cannot.
 */
export function UserSearchPanel() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isSearching, startSearch] = useTransition();
  const [grantState, grantFormAction, grantPending] = useActionState(
    grantSubscriptionAction,
    { ok: false, message: "" },
  );

  // Debounced so typing does not fire a query per keystroke. `grantState` is a
  // dependency so the pass column refreshes right after a grant.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      startSearch(async () => {
        setRows(await searchUsersAction(query));
        setHasLoaded(true);
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query, grantState, startSearch]);

  return (
    <section className="ad-card motion-ink-up p-4 sm:p-5">
      <div className="mb-1 flex items-center gap-2">
        <UserRound size={17} style={{ color: "var(--home-gold)" }} />
        <h2 className="ad-h3">Хэрэглэгч хайх</h2>
      </div>
      <p className="ad-sub max-w-2xl">
        И-мэйл эсвэл нэрээр хайж, шууд багц олгоно. Google, Facebook-ээр
        бүртгүүлсэн хэрэглэгчийн хаягийг мэдэхгүй байсан ч эндээс олно.
      </p>

      <div className="relative mt-4">
        <Search
          size={15}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--home-plum-soft)",
            pointerEvents: "none",
          }}
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="и-мэйл эсвэл нэр…"
          aria-label="Хэрэглэгч хайх"
          className="ad-input w-full"
          style={{ paddingLeft: 34 }}
        />
      </div>

      <div className="mt-4 grid gap-2">
        {rows.map((row) => {
          const left = daysLeft(row.premiumUntil);

          return (
            <form
              key={row.id}
              action={grantFormAction}
              className="grid items-center gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_auto_auto]"
              style={{
                borderColor: "var(--home-line)",
                background: "var(--home-paper-2)",
              }}
            >
              <input type="hidden" name="userId" value={row.id} />

              <div className="min-w-0">
                <p
                  className="truncate text-sm font-semibold"
                  style={{ color: "var(--home-plum)" }}
                >
                  {row.email}
                </p>
                <p
                  className="mt-0.5 truncate text-xs"
                  style={{ color: "var(--home-plum-soft)" }}
                >
                  {row.username ? `${row.username} · ` : ""}
                  {left === null ? "Багц идэвхгүй" : `${left} хоног үлдсэн`}
                </p>
              </div>

              <select
                name="plan"
                defaultValue="ONE_MONTH"
                aria-label={`${row.email} — багц сонгох`}
                className="ad-input"
              >
                {PLAN_ORDER.map((key) => (
                  <option key={key} value={key}>
                    {PLANS[key].label} — {formatTugrug(PLANS[key].price)}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={grantPending}
                className="ad-btn ad-btn-primary"
              >
                <Crown size={16} />
                Олгох
              </button>
            </form>
          );
        })}

        {hasLoaded && !isSearching && rows.length === 0 ? (
          <p className="ad-sub py-3">
            {query.trim()
              ? `"${query.trim()}" гэсэн хэрэглэгч олдсонгүй.`
              : "Хэрэглэгч алга байна."}
          </p>
        ) : null}
      </div>

      {grantState.message ? (
        <p
          className="mt-3 text-sm font-medium"
          style={{ color: grantState.ok ? "#3f7d57" : "#c44d66" }}
        >
          {grantState.message}
        </p>
      ) : null}
    </section>
  );
}
