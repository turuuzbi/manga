"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Download, ImageOff, Sparkles } from "lucide-react";
import {
  applySiteBackgroundAction,
  getBackgroundDownloadUrlAction,
} from "@/app/profile/actions";
import { applyUserBackground } from "@/lib/news-client";

export type EarnedBackground = {
  id: string;
  mangaName: string;
  imageUrl: string;
  grantedLabel: string;
};

export const GALLERY_STYLES = `
.yume-profile .yp-grid {
  display: grid; gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
@media (min-width: 720px) { .yume-profile .yp-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (min-width: 1040px) { .yume-profile .yp-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.yume-profile .yp-card {
  display: flex; flex-direction: column;
  border-radius: 20px; overflow: hidden;
  background: color-mix(in srgb, var(--home-paper) 94%, transparent);
  border: 1px solid var(--home-line);
  box-shadow: 0 16px 36px -24px var(--home-shadow-strong);
}
.yume-profile .yp-card.is-active {
  border-color: var(--home-rose);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--home-rose) 30%, transparent), 0 16px 36px -24px var(--home-shadow-strong);
}
.yume-profile .yp-image { position: relative; aspect-ratio: 9 / 16; background: var(--home-paper-2); }
.yume-profile .yp-image img { width: 100%; height: 100%; object-fit: cover; display: block; }
.yume-profile .yp-active {
  position: absolute; top: 8px; left: 8px;
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 9px; border-radius: 999px;
  font-family: 'Marcellus', serif; font-size: 9.5px; letter-spacing: 0.14em; text-transform: uppercase;
  color: #fff; background: linear-gradient(135deg, var(--home-rose), var(--home-rose-deep));
}
.yume-profile .yp-body { padding: 12px 12px 14px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
.yume-profile .yp-name {
  font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 17px; line-height: 1.15;
  color: var(--home-plum);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.yume-profile .yp-date { margin-top: 2px; font-size: 11.5px; color: var(--home-plum-soft); }
.yume-profile .yp-actions { margin-top: auto; display: flex; flex-direction: column; gap: 7px; }
.yume-profile .yp-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-height: 40px; padding: 9px 12px; border-radius: 999px;
  font-family: 'Marcellus', serif; font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase;
  cursor: pointer; border: 1px solid var(--home-line); background: var(--home-paper); color: var(--home-plum);
  transition: border-color 0.2s, color 0.2s, transform 0.2s;
}
.yume-profile .yp-btn:hover:not(:disabled) { border-color: var(--home-rose); color: var(--home-rose-deep); }
.yume-profile .yp-btn:disabled { opacity: 0.6; cursor: progress; }
.yume-profile .yp-btn-primary {
  color: #fff; border-color: rgba(255, 255, 255, 0.25);
  background: linear-gradient(135deg, var(--home-rose), var(--home-rose-deep));
}
.yume-profile .yp-btn-primary:hover:not(:disabled) { color: #fff; transform: translateY(-1px); }
.yume-profile .yp-error {
  display: flex; align-items: flex-start; gap: 8px; margin-bottom: 16px;
  border-radius: 16px; padding: 12px 14px; font-size: 13.5px;
  color: #9c4a59; background: color-mix(in srgb, #c15f73 12%, var(--home-paper));
  border: 1px solid color-mix(in srgb, #c15f73 40%, transparent);
}
`;

/**
 * "Миний background": the reader's earned backgrounds. Apply one site-wide,
 * remove it, or download the original upload.
 */
export function BackgroundGallery({
  backgrounds,
  activeId,
}: {
  backgrounds: EarnedBackground[];
  activeId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Optimistic: the page refresh that confirms it follows a moment later.
  const [appliedId, setAppliedId] = useState<{ id: string | null } | null>(null);
  const currentId = appliedId ? appliedId.id : activeId;

  function apply(rewardId: string | null) {
    setError(null);
    setBusyId(rewardId ?? "none");
    startTransition(async () => {
      try {
        const result = await applySiteBackgroundAction(rewardId);

        if (!result.ok) {
          setError(result.message);
          return;
        }

        applyUserBackground(result.imageUrl);
        setAppliedId({ id: rewardId });
        router.refresh();
      } catch {
        setError("Сервертэй холбогдож чадсангүй. Дахин оролдоно уу.");
      } finally {
        setBusyId(null);
      }
    });
  }

  function download(rewardId: string) {
    setError(null);
    setBusyId(`download:${rewardId}`);
    startTransition(async () => {
      try {
        const result = await getBackgroundDownloadUrlAction(rewardId);

        if (!result.ok) {
          setError(result.message);
          return;
        }

        // Same-tab navigation to an attachment: iPhone Safari shows its
        // download prompt and the page stays where it is.
        window.location.href = result.url;
      } catch {
        setError("Сервертэй холбогдож чадсангүй. Дахин оролдоно уу.");
      } finally {
        setBusyId(null);
      }
    });
  }

  return (
    <>
      {error ? (
        <p className="yp-error" role="alert">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      ) : null}

      <div className="yp-grid">
        {backgrounds.map((background) => {
          const active = background.id === currentId;

          return (
            <div key={background.id} className={`yp-card${active ? " is-active" : ""}`}>
              <div className="yp-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={background.imageUrl} alt={background.mangaName} loading="lazy" />
                {active ? (
                  <span className="yp-active">
                    <Check size={11} /> Ашиглаж байна
                  </span>
                ) : null}
              </div>
              <div className="yp-body">
                <div>
                  <p className="yp-name">{background.mangaName}</p>
                  <p className="yp-date">{background.grantedLabel}</p>
                </div>
                <div className="yp-actions">
                  {active ? (
                    <button
                      type="button"
                      className="yp-btn"
                      disabled={isPending}
                      onClick={() => apply(null)}
                    >
                      <ImageOff size={13} />
                      {busyId === "none" ? "..." : "Хасах"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="yp-btn yp-btn-primary"
                      disabled={isPending}
                      onClick={() => apply(background.id)}
                    >
                      <Sparkles size={13} />
                      {busyId === background.id ? "..." : "Ашиглах"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="yp-btn"
                    disabled={isPending}
                    onClick={() => download(background.id)}
                  >
                    <Download size={13} />
                    {busyId === `download:${background.id}` ? "..." : "Эх зургийг татах"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
