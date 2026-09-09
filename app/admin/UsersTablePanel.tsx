"use client";

import { useEffect, useState, useTransition } from "react";
import { Crown, RefreshCw, UserRound, Users } from "lucide-react";
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
  return new Date(iso).toLocaleDateString();
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
 * Registered readers, with the headline totals above them. Data comes from a
 * server action so the roster is never part of the page payload and never
 * reachable without the admin check.
 */
export function UsersTablePanel() {
  const [data, setData] = useState<AdminUsersOverview>(EMPTY);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, startLoad] = useTransition();

  function load() {
    startLoad(async () => {
      setData(await getUsersOverviewAction());
      setHasLoaded(true);
    });
  }

  useEffect(load, []);

  return (
    <section className="ad-card motion-ink-up p-5 sm:p-7">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <p className="ad-eyebrow">Бүртгэл</p>
          <h2 className="ad-h2">Хэрэглэгчдийн хүснэгт</h2>
          <p className="ad-sub">
            Бүртгүүлсэн уншигчид, эрхийн төлөв. Зөвхөн админд харагдана.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={isLoading}
          className="ad-btn"
        >
          <RefreshCw size={15} />
          {isLoading ? "Ачаалж байна..." : "Сэргээх"}
        </button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="ad-soft flex items-center gap-3 p-4">
          <Users size={20} style={{ color: "var(--home-gold)" }} />
          <div>
            <p className="ad-inforow-label">Нийт бүртгэлтэй</p>
            <p
              className="text-2xl font-bold"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: "var(--home-plum)",
              }}
            >
              {data.totalUsers.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="ad-soft flex items-center gap-3 p-4">
          <Crown size={20} style={{ color: "var(--home-gold)" }} />
          <div>
            <p className="ad-inforow-label">Эрхтэй хэрэглэгч</p>
            <p
              className="text-2xl font-bold"
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

      {hasLoaded && data.users.length === 0 ? (
        <div
          className="ad-dashed p-4 text-sm"
          style={{ color: "var(--home-plum-soft)" }}
        >
          Хэрэглэгч алга байна.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Хэрэглэгч", "Бүртгүүлсэн", "Эрх"].map((heading) => (
                  <th
                    key={heading}
                    className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.18em]"
                    style={{
                      color: "var(--home-gold)",
                      borderBottom: "1px solid var(--home-line)",
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.users.map((user) => {
                const left = daysLeft(user.premiumUntil);

                return (
                  <tr key={user.id}>
                    <td
                      className="px-3 py-2.5"
                      style={{ borderBottom: "1px solid var(--home-line)" }}
                    >
                      <span
                        className="flex items-center gap-2 font-semibold"
                        style={{ color: "var(--home-plum)" }}
                      >
                        <UserRound size={14} style={{ opacity: 0.6 }} />
                        {user.email}
                        {user.role === "ADMIN" ? (
                          <span className="ad-chip">Админ</span>
                        ) : null}
                      </span>
                      {user.username ? (
                        <span
                          className="mt-0.5 block text-xs"
                          style={{ color: "var(--home-plum-soft)" }}
                        >
                          {user.username}
                        </span>
                      ) : null}
                    </td>
                    <td
                      className="whitespace-nowrap px-3 py-2.5"
                      style={{
                        color: "var(--home-plum-soft)",
                        borderBottom: "1px solid var(--home-line)",
                      }}
                    >
                      {formatDate(user.createdAt)}
                    </td>
                    <td
                      className="whitespace-nowrap px-3 py-2.5"
                      style={{ borderBottom: "1px solid var(--home-line)" }}
                    >
                      {left === null ? (
                        <span style={{ color: "var(--home-plum-soft)" }}>
                          Эрхгүй
                        </span>
                      ) : (
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-bold text-white"
                          style={{ background: "var(--home-rose-deep)" }}
                        >
                          {left} хоног
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
