"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Crown, RefreshCw, Search, Users } from "lucide-react";
import {
  getUsersOverviewAction,
  type AdminUsersOverview,
} from "@/app/admin/actions";

const EMPTY: AdminUsersOverview = {
  totalUsers: 0,
  entitledUsers: 0,
  users: [],
};

function formatDate(iso: string) {
  const date = new Date(iso);

  // Short and fixed-width-ish: long dates were a big part of what pushed the
  // old three-column table off the side of a phone.
  return `${String(date.getFullYear()).slice(2)}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

/** Whole days left on a pass, or null when there is none / it has lapsed. */
function daysLeft(premiumUntil: string | null): number | null {
  if (!premiumUntil) {
    return null;
  }

  const msLeft = new Date(premiumUntil).getTime() - Date.now();

  return msLeft > 0 ? Math.ceil(msLeft / 86_400_000) : null;
}

/**
 * Registered readers, with the headline totals above them.
 *
 * Laid out as rows rather than a `<table>`: with 547 readers the addresses are
 * long, and three fixed columns pushed the entitlement column off the side of a
 * phone. A wrapping flex row cannot overflow — the address takes the space it
 * has and the date/entitlement pair drops beneath it when there is not enough.
 *
 * Data comes from a server action, so the roster is never in the page payload
 * and never reachable without the admin check.
 */
export function UsersTablePanel() {
  const [data, setData] = useState<AdminUsersOverview>(EMPTY);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, startLoad] = useTransition();

  function load() {
    startLoad(async () => {
      setData(await getUsersOverviewAction());
      setHasLoaded(true);
    });
  }

  useEffect(load, []);

  // Filtered in the browser over rows already fetched — no extra round trip,
  // and with hundreds of readers scrolling alone is not a way to find someone.
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return data.users;
    }

    return data.users.filter(
      (user) =>
        user.email.toLowerCase().includes(term) ||
        (user.username ?? "").toLowerCase().includes(term),
    );
  }, [data.users, query]);

  return (
    <section className="ad-card motion-ink-up p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1.5">
          <p className="ad-eyebrow">Бүртгэл</p>
          <h2 className="ad-h3">Хэрэглэгчдийн хүснэгт</h2>
          <p className="ad-sub">Зөвхөн админд харагдана.</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={isLoading}
          className="ad-btn"
        >
          <RefreshCw size={14} />
          {isLoading ? "Ачаалж байна..." : "Сэргээх"}
        </button>
      </div>

      {/* Two across even on the narrowest phone: these are short numbers, and
          stacking them wasted most of a screen before the list began. */}
      <div className="mb-4 grid grid-cols-2 gap-2.5">
        <div className="ad-soft flex items-center gap-2.5 p-3">
          <Users size={17} style={{ color: "var(--home-gold)" }} />
          <div className="min-w-0">
            <p className="ad-inforow-label">Нийт</p>
            <p
              className="text-xl font-bold leading-tight"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: "var(--home-plum)",
              }}
            >
              {data.totalUsers.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="ad-soft flex items-center gap-2.5 p-3">
          <Crown size={17} style={{ color: "var(--home-gold)" }} />
          <div className="min-w-0">
            <p className="ad-inforow-label">Эрхтэй</p>
            <p
              className="text-xl font-bold leading-tight"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: "var(--home-plum)",
              }}
            >
              {data.entitledUsers.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="relative mb-3">
        <Search
          size={14}
          style={{
            position: "absolute",
            left: 11,
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
          placeholder="и-мэйл эсвэл нэрээр шүүх…"
          aria-label="Хэрэглэгч шүүх"
          className="ad-input w-full"
          style={{ paddingLeft: 32, fontSize: 13 }}
        />
      </div>

      {hasLoaded ? (
        <p
          className="mb-2 text-[11px]"
          style={{ color: "var(--home-plum-soft)" }}
        >
          {query.trim()
            ? `${visible.length} илэрц`
            : `Сүүлийн ${data.users.length} бүртгэл`}
        </p>
      ) : null}

      {hasLoaded && visible.length === 0 ? (
        <div
          className="ad-dashed p-4 text-sm"
          style={{ color: "var(--home-plum-soft)" }}
        >
          {query.trim() ? "Илэрц олдсонгүй." : "Хэрэглэгч алга байна."}
        </div>
      ) : (
        <div className="flex flex-col">
          {visible.map((user) => {
            const left = daysLeft(user.premiumUntil);

            return (
              <div
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2.5"
                style={{ borderBottom: "1px solid var(--home-line)" }}
              >
                <span className="flex min-w-0 flex-1 items-center gap-1.5">
                  <span
                    className="truncate text-[13px] font-semibold"
                    style={{ color: "var(--home-plum)" }}
                    title={user.email}
                  >
                    {user.email}
                  </span>
                  {user.role === "ADMIN" ? (
                    <span
                      className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase"
                      style={{
                        background:
                          "color-mix(in srgb, var(--home-gold) 22%, transparent)",
                        color: "var(--home-plum)",
                      }}
                    >
                      Админ
                    </span>
                  ) : null}
                </span>

                <span className="flex shrink-0 items-center gap-2.5">
                  <span
                    className="text-[11px] tabular-nums"
                    style={{ color: "var(--home-plum-soft)" }}
                  >
                    {formatDate(user.createdAt)}
                  </span>
                  {left === null ? (
                    <span
                      className="text-[11px]"
                      style={{ color: "var(--home-plum-soft)", opacity: 0.7 }}
                    >
                      —
                    </span>
                  ) : (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                      style={{ background: "var(--home-rose-deep)" }}
                      title={`Эрх дуусах хүртэл ${left} хоног`}
                    >
                      {left}х
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
