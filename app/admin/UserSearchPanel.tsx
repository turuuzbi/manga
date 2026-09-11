"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  ChevronDown,
  ChevronRight,
  Crown,
  Search,
  UserRound,
} from "lucide-react";
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
 * Find a reader and grant them a pass without knowing their address up front —
 * which someone who signed in through Google or Facebook often cannot supply.
 *
 * Collapsed by default, and searches only once something is typed. It used to
 * sit open above the tab row listing the twenty most recent readers as
 * full-height cards, which on a phone pushed every tab below ~3,000px of scroll
 * and cost a query on each admin page load. Recent signups live in the
 * Хэрэглэгчдийн хүснэгт tab, so nothing is lost by not listing them twice.
 */
export function UserSearchPanel() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // Results carry the term they belong to, so a stale set is never shown while
  // a newer query is still debouncing. Storing them together also means the
  // effect never has to clear state, which the compiler forbids in its body.
  const [result, setResult] = useState<{
    term: string;
    rows: AdminUserRow[];
  } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [grantState, grantFormAction, grantPending] = useActionState(
    grantSubscriptionAction,
    { ok: false, message: "" },
  );

  const term = query.trim();
  const isCurrent = result?.term === term;
  const rows = isCurrent ? result.rows : [];

  // Debounced so typing does not fire a query per keystroke. `grantState` is a
  // dependency so entitlement refreshes right after a grant.
  useEffect(() => {
    if (!open || !term) {
      return;
    }

    const timer = window.setTimeout(() => {
      startSearch(async () => {
        setResult({ term, rows: await searchUsersAction(term) });
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [open, term, grantState, startSearch]);

  return (
    <section className="ad-card motion-ink-up p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left"
      >
        <UserRound size={17} style={{ color: "var(--home-gold)" }} />
        <span className="ad-h3 flex-1">Хэрэглэгч хайх</span>
        {open ? (
          <ChevronDown size={17} style={{ color: "var(--home-plum-soft)" }} />
        ) : (
          <ChevronRight size={17} style={{ color: "var(--home-plum-soft)" }} />
        )}
      </button>

      {open ? (
        <>
          <p className="ad-sub mt-2 max-w-2xl">
            И-мэйл эсвэл нэрээр хайж, шууд багц олгоно. Google, Facebook-ээр
            бүртгүүлсэн хэрэглэгчийн хаягийг мэдэхгүй байсан ч эндээс олно.
          </p>

          <div className="relative mt-3">
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
              style={{ paddingLeft: 34, fontSize: 13 }}
            />
          </div>

          <div className="mt-3 grid gap-1.5">
            {rows.map((row) => {
              const left = daysLeft(row.premiumUntil);
              const isExpanded = expandedId === row.id;

              return (
                // min-w-0: a grid item defaults to min-width:auto, which lets a
                // long address grow the row past its track instead of
                // truncating, pushing the entitlement off a phone screen.
                <div
                  key={row.id}
                  className="min-w-0 rounded-xl border"
                  style={{
                    borderColor: "var(--home-line)",
                    background: "var(--home-paper-2)",
                  }}
                >
                  {/* Kept outside the form below — a nested button would submit it. */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : row.id)
                    }
                    aria-expanded={isExpanded}
                    className="flex w-full items-center gap-2 p-2.5 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13px] font-semibold"
                        style={{ color: "var(--home-plum)" }}
                        title={row.email}
                      >
                        {row.email}
                      </span>
                      {row.username ? (
                        <span
                          className="block truncate text-[11px]"
                          style={{ color: "var(--home-plum-soft)" }}
                        >
                          {row.username}
                        </span>
                      ) : null}
                    </span>

                    {left === null ? (
                      <span
                        className="shrink-0 text-[11px]"
                        style={{ color: "var(--home-plum-soft)" }}
                      >
                        Эрхгүй
                      </span>
                    ) : (
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                        style={{ background: "var(--home-rose-deep)" }}
                      >
                        {left}х
                      </span>
                    )}

                    {isExpanded ? (
                      <ChevronDown
                        size={15}
                        className="shrink-0"
                        style={{ color: "var(--home-plum-soft)" }}
                      />
                    ) : (
                      <ChevronRight
                        size={15}
                        className="shrink-0"
                        style={{ color: "var(--home-plum-soft)" }}
                      />
                    )}
                  </button>

                  {isExpanded ? (
                    <form
                      action={grantFormAction}
                      onSubmit={() => setExpandedId(null)}
                      className="flex flex-wrap items-center gap-2 px-2.5 pb-2.5"
                      style={{ borderTop: "1px dashed var(--home-line)" }}
                    >
                      <input type="hidden" name="userId" value={row.id} />

                      <select
                        name="plan"
                        defaultValue="ONE_MONTH"
                        aria-label={`${row.email} — багц сонгох`}
                        className="ad-input mt-2.5 min-w-0 flex-1 basis-40"
                        style={{ fontSize: 13 }}
                      >
                        {/* `left !== null` means the pass is still running, so
                            the grant will apply the early-renewal price. Shown
                            here so the figure matches what the reader was asked
                            to transfer; the server recomputes it regardless. */}
                        {PLAN_ORDER.map((key) => {
                          const renewal = PLANS[key].renewalPrice;
                          const discounted = left !== null && renewal !== null;

                          return (
                            <option key={key} value={key}>
                              {PLANS[key].label} —{" "}
                              {formatTugrug(
                                discounted ? renewal : PLANS[key].price,
                              )}
                              {discounted ? " (сунгалт -10%)" : ""}
                            </option>
                          );
                        })}
                      </select>

                      <button
                        type="submit"
                        disabled={grantPending}
                        className="ad-btn ad-btn-primary mt-2.5 shrink-0 whitespace-nowrap"
                      >
                        <Crown size={15} />
                        {grantPending ? "Олгож байна..." : "Олгох"}
                      </button>
                    </form>
                  ) : null}
                </div>
              );
            })}

            {!term ? (
              <p
                className="py-2 text-[12px]"
                style={{ color: "var(--home-plum-soft)" }}
              >
                Хайх утгаа бичнэ үү. Бүх бүртгэлийг «Хэрэглэгчдийн хүснэгт»
                хэсгээс харна.
              </p>
            ) : isCurrent && !isSearching && rows.length === 0 ? (
              <p
                className="py-2 text-[12px]"
                style={{ color: "var(--home-plum-soft)" }}
              >
                «{term}» гэсэн хэрэглэгч олдсонгүй.
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
        </>
      ) : null}
    </section>
  );
}
