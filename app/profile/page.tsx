import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChevronLeft, Gift } from "lucide-react";
import prisma from "@/lib/db";
import { syncCurrentClerkUser } from "@/lib/auth";
import { premiumDaysRemaining } from "@/lib/plans";
import { formatDateMn } from "@/lib/relative-time";
import { MangaTopNav } from "@/app/_components/MangaTopNav";
import { CelestialFrame } from "@/app/_components/CelestialFrame";
import {
  SectionHeader,
  YUME_CARD_STYLES,
} from "@/app/_components/MangaPosterCard";
import {
  BackgroundGallery,
  GALLERY_STYLES,
} from "@/app/profile/BackgroundGallery";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Миний background — ЮҮМЭ Орчуулагч",
};

const PROFILE_STYLES = `
.yume-profile { font-family: 'Plus Jakarta Sans', sans-serif; }
.yume-profile * { box-sizing: border-box; }
.yume-profile .yp-back {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: 'Marcellus', serif;
  font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--home-plum-soft); text-decoration: none;
  transition: color 0.2s, transform 0.2s;
}
.yume-profile .yp-back:hover { color: var(--home-rose-deep); transform: translateX(-2px); }
.yume-profile .yp-intro { margin: -8px 0 24px; font-size: 14px; line-height: 1.7; color: var(--home-plum-soft); max-width: 560px; }
.yume-profile .yp-empty {
  border-radius: 24px; border: 1px dashed var(--home-line-strong);
  background: color-mix(in srgb, var(--home-paper) 90%, transparent);
  padding: 48px 22px; text-align: center; color: var(--home-plum-soft);
}
.yume-profile .yp-empty-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 54px; height: 54px; border-radius: 999px; margin-bottom: 14px;
  color: #fff; background: linear-gradient(135deg, var(--home-gold-soft), var(--home-rose));
}
`;

/**
 * The reader's own page. For now it holds "Миний background": completion
 * rewards they have earned, which they can apply behind the whole site.
 */
export default async function ProfilePage() {
  const user = await syncCurrentClerkUser();

  if (!user) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent("/profile")}`);
  }

  const rewards = await prisma.userReward.findMany({
    where: { userId: user.id },
    orderBy: { grantedAt: "desc" },
    select: { id: true, mangaName: true, imageUrl: true, grantedAt: true },
  });

  return (
    <>
      <style>{YUME_CARD_STYLES}</style>
      <style>{PROFILE_STYLES + GALLERY_STYLES}</style>

      <div className="yume-surface yume-profile relative min-h-screen">
        <CelestialFrame />

        <MangaTopNav
          isAdmin={user.role === "ADMIN"}
          premiumDaysLeft={premiumDaysRemaining(user)}
        />

        <main
          className="motion-ink-fade relative mx-auto max-w-6xl px-4 pb-16 pt-8 md:px-8"
          style={{ zIndex: 1 }}
        >
          <Link href="/" className="yp-back motion-ink-up">
            <ChevronLeft size={14} />
            Нүүр
          </Link>

          <section id="backgrounds" className="mt-6 scroll-mt-24">
            <SectionHeader eyebrow="Бэлэг" title="Миний background" />
            <p className="yp-intro">
              Бэлэгтэй мангын бүх бүлгийг уншиж дуусгахад энд background
              нэмэгдэнэ. Сайтын арын зураг болгож, хүссэн үедээ хасаж, эх
              зургийг нь татаж авч болно.
            </p>

            {rewards.length > 0 ? (
              <BackgroundGallery
                activeId={user.siteBackgroundId}
                backgrounds={rewards.map((reward) => ({
                  id: reward.id,
                  mangaName: reward.mangaName,
                  imageUrl: reward.imageUrl,
                  grantedLabel: formatDateMn(reward.grantedAt),
                }))}
              />
            ) : (
              <div className="yp-empty">
                <span className="yp-empty-icon">
                  <Gift size={24} />
                </span>
                <p>Одоогоор background алга.</p>
                <p className="mt-1 text-sm">
                  Бэлэгтэй мангын бүх бүлгийг уншаад авна уу.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}
