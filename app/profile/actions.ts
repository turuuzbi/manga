"use server";

import { revalidatePath } from "next/cache";
import { getCurrentDbUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { createPresignedDownload, getOwnR2Key } from "@/lib/r2";

export type BackgroundActionResult =
  | { ok: true; imageUrl: string | null }
  | { ok: false; message: string };

/**
 * Applies one of the reader's earned backgrounds site-wide, or with null
 * removes it. Only a reward this reader owns can be applied.
 */
export async function applySiteBackgroundAction(
  rewardId: string | null,
): Promise<BackgroundActionResult> {
  try {
    const user = await getCurrentDbUser();

    if (!user) {
      return { ok: false, message: "Нэвтэрч орно уу." };
    }

    if (!rewardId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { siteBackgroundId: null },
      });
      revalidatePath("/profile");
      return { ok: true, imageUrl: null };
    }

    const reward = await prisma.userReward.findFirst({
      where: { id: rewardId, userId: user.id },
      select: { id: true, imageUrl: true },
    });

    if (!reward) {
      return { ok: false, message: "Энэ background олдсонгүй." };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { siteBackgroundId: reward.id },
    });
    revalidatePath("/profile");

    return { ok: true, imageUrl: reward.imageUrl };
  } catch (error) {
    console.error("[profile] apply background failed", error);
    return { ok: false, message: "Хадгалж чадсангүй. Дахин оролдоно уу." };
  }
}

/**
 * A short-lived link that downloads the original upload of an earned
 * background as a file (see createPresignedDownload for why a plain link is
 * not enough on iPhone Safari).
 */
export async function getBackgroundDownloadUrlAction(
  rewardId: string,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  try {
    const user = await getCurrentDbUser();

    if (!user) {
      return { ok: false, message: "Нэвтэрч орно уу." };
    }

    const reward = await prisma.userReward.findFirst({
      where: { id: rewardId, userId: user.id },
      select: { originalUrl: true, imageUrl: true, mangaName: true },
    });

    if (!reward) {
      return { ok: false, message: "Энэ background олдсонгүй." };
    }

    const source = reward.originalUrl || reward.imageUrl;
    const key = getOwnR2Key(source);

    if (!key) {
      // Not on our bucket (should not happen): the plain URL still opens it.
      return { ok: true, url: source };
    }

    const ext = key.split(".").pop() ?? "jpg";
    const safeName = reward.mangaName.replace(/[\/:*?"<>|]+/g, " ").trim().slice(0, 80);

    return {
      ok: true,
      url: await createPresignedDownload(key, `${safeName || "yume"} background.${ext}`),
    };
  } catch (error) {
    console.error("[profile] background download failed", error);
    return { ok: false, message: "Татах холбоос үүсгэж чадсангүй." };
  }
}
