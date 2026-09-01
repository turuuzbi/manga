"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

/**
 * HH:MM:SS. Hours are not wrapped at 24 — the wait can be longer than a day,
 * and "30:12:45" is clearer than a separate day counter. padStart never
 * truncates, so three-digit hours would still render in full.
 */
function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    pad(Math.floor(total / 3600)),
    pad(Math.floor((total % 3600) / 60)),
    pad(total % 60),
  ].join(":");
}

/** How long to wait between re-asking the server whether the page has opened. */
const REFRESH_RETRY_MS = 5000;

export function AboutCountdown({
  unlockAtIso,
  initialRemainingMs,
  unlockLabel,
}: {
  unlockAtIso: string;
  /**
   * Computed on the server, so the first client render produces exactly the
   * same markup and hydration stays quiet. The interval takes over on mount.
   */
  initialRemainingMs: number;
  unlockLabel: string;
}) {
  const [remaining, setRemaining] = useState(initialRemainingMs);
  const router = useRouter();
  const lastRefreshAt = useRef(0);

  useEffect(() => {
    const unlockAt = new Date(unlockAtIso).getTime();

    function tick() {
      const now = Date.now();
      const left = unlockAt - now;
      setRemaining(left);

      // The gate is enforced on the server and this client was never sent the
      // page content, so ask for a fresh render rather than trying to reveal
      // something that is not here.
      //
      // Retried on a throttle rather than fired once: if the server's clock
      // trails the browser's by even a second, a single attempt would come
      // back still locked and the reader would sit at 00:00:00 until they
      // reloaded by hand. Once the server agrees, this component unmounts and
      // the retries stop with it.
      if (left <= 0 && now - lastRefreshAt.current >= REFRESH_RETRY_MS) {
        lastRefreshAt.current = now;
        router.refresh();
      }
    }

    tick();
    const timer = window.setInterval(tick, 1000);

    return () => window.clearInterval(timer);
  }, [unlockAtIso, router]);

  return (
    <section className="motion-ink-up ya-gate">
      <div className="ya-gate-dial">
        <Lock
          className="ya-gate-lock"
          size={190}
          strokeWidth={1.1}
          aria-hidden="true"
        />
        {/* Hidden from screen readers: a value that changes every second is
            noise to announce. The unlock time below says the same thing once. */}
        <span className="ya-gate-time" aria-hidden="true">
          {formatCountdown(remaining)}
        </span>
      </div>

      <h1 className="ya-gate-title">Бидний тухай</h1>
      <p className="ya-gate-note">Энэ хуудас удахгүй нээгдэнэ.</p>
      <p className="ya-gate-when">{unlockLabel}</p>
    </section>
  );
}
