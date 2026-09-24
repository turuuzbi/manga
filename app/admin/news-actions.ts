"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { requireAdminUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { deleteFromR2, getR2KeyFromUrl } from "@/lib/r2";
import { readUploadedUrl } from "@/lib/uploads";

export type NewsActionState = {
  ok: boolean;
  message: string;
  /** Id of the article just saved, so the panel can keep it selected. */
  articleId?: string;
};

export type AdminArticle = {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  authorName: string;
  publishedAt: string;
};

const MAX_TITLE_LENGTH = 200;
const MAX_BODY_LENGTH = 20_000;
const MAX_AUTHOR_LENGTH = 80;

/** Byline when an admin has no display name anywhere. Never an email. */
const FALLBACK_AUTHOR = "ЮҮМЭ Орчуулагч";

/**
 * The admin's display name for a new article's byline: their Clerk username
 * or name. Most admin rows have no username, and the usual fallback (the
 * email's local part) must not be printed on a public page.
 */
async function defaultAuthorName(dbUsername: string | null) {
  try {
    const clerkUser = await currentUser();
    const name =
      clerkUser?.username ||
      clerkUser?.fullName ||
      [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ");

    if (name?.trim()) {
      return name.trim();
    }
  } catch {
    // Clerk unreachable: fall through to what the database knows.
  }

  return dbUsername?.trim() || FALLBACK_AUTHOR;
}

export async function listArticlesAction(): Promise<{
  articles: AdminArticle[];
  defaultAuthorName: string;
} | null> {
  const adminUser = await requireAdminUser();

  if (!adminUser) {
    return null;
  }

  const [articles, authorName] = await Promise.all([
    prisma.article.findMany({
      orderBy: { publishedAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        body: true,
        imageUrl: true,
        authorName: true,
        publishedAt: true,
      },
    }),
    defaultAuthorName(adminUser.username),
  ]);

  return {
    articles: articles.map((article) => ({
      ...article,
      publishedAt: article.publishedAt.toISOString(),
    })),
    defaultAuthorName: authorName,
  };
}

function revalidateNews(articleId?: string) {
  revalidatePath("/news");
  if (articleId) {
    revalidatePath(`/news/${articleId}`);
  }
}

async function deleteImageQuietly(url: string | null | undefined) {
  const key = url ? getR2KeyFromUrl(url) : null;

  if (!key?.startsWith("news/")) {
    return;
  }

  try {
    await deleteFromR2(key);
  } catch {
    // The row no longer points at it; a stale file can be swept later.
  }
}

/**
 * Creates an article (publishing it at once — that is what raises every
 * reader's badge and popup) or updates one. Editing never re-notifies:
 * publishedAt stays as it was.
 */
export async function saveArticleAction(
  _previous: NewsActionState,
  formData: FormData,
): Promise<NewsActionState> {
  try {
    const adminUser = await requireAdminUser();

    if (!adminUser) {
      return { ok: false, message: "Нийтлэл бичихэд админ эрх шаардлагатай." };
    }

    const articleId = String(formData.get("articleId") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const authorInput = String(formData.get("authorName") ?? "").trim();
    const removeImage = formData.get("removeImage") === "on";
    const uploadedImageUrl = readUploadedUrl(formData, "imageUrl", "news/");

    if (!title) {
      return { ok: false, message: "Гарчиг оруулна уу." };
    }

    if (title.length > MAX_TITLE_LENGTH) {
      return {
        ok: false,
        message: `Гарчиг ${MAX_TITLE_LENGTH} тэмдэгтээс богино байх ёстой.`,
      };
    }

    if (!body) {
      return { ok: false, message: "Нийтлэлийн агуулгаа бичнэ үү." };
    }

    if (body.length > MAX_BODY_LENGTH) {
      return {
        ok: false,
        message: `Агуулга ${MAX_BODY_LENGTH.toLocaleString()} тэмдэгтээс хэтэрсэн байна.`,
      };
    }

    const authorName =
      authorInput.slice(0, MAX_AUTHOR_LENGTH) ||
      (await defaultAuthorName(adminUser.username));

    if (articleId) {
      const existing = await prisma.article.findUnique({
        where: { id: articleId },
        select: { id: true, imageUrl: true },
      });

      if (!existing) {
        return { ok: false, message: "Нийтлэл олдсонгүй." };
      }

      const imageUrl = uploadedImageUrl
        ? uploadedImageUrl
        : removeImage
          ? null
          : existing.imageUrl;

      await prisma.article.update({
        where: { id: existing.id },
        data: { title, body, authorName, imageUrl },
      });

      if (existing.imageUrl && existing.imageUrl !== imageUrl) {
        await deleteImageQuietly(existing.imageUrl);
      }

      revalidateNews(existing.id);

      return { ok: true, message: "Нийтлэл шинэчлэгдлээ.", articleId: existing.id };
    }

    const article = await prisma.article.create({
      data: {
        title,
        body,
        authorName,
        authorId: adminUser.id,
        imageUrl: uploadedImageUrl,
      },
      select: { id: true },
    });

    revalidateNews(article.id);

    return {
      ok: true,
      message: "Нийтлэл нийтлэгдлээ. Уншигчдад мэдэгдэл очно.",
      articleId: article.id,
    };
  } catch (error) {
    console.error("[admin] save article failed", error);

    return {
      ok: false,
      message:
        error instanceof Error && error.message.startsWith("Зургийн")
          ? error.message
          : "Нийтлэл хадгалахад алдаа гарлаа. Дахин оролдоно уу.",
    };
  }
}

export async function deleteArticleAction(
  _previous: NewsActionState,
  formData: FormData,
): Promise<NewsActionState> {
  try {
    const adminUser = await requireAdminUser();

    if (!adminUser) {
      return { ok: false, message: "Нийтлэл устгахад админ эрх шаардлагатай." };
    }

    const articleId = String(formData.get("articleId") ?? "").trim();
    const existing = articleId
      ? await prisma.article.findUnique({
          where: { id: articleId },
          select: { id: true, imageUrl: true },
        })
      : null;

    if (!existing) {
      return { ok: false, message: "Нийтлэл олдсонгүй." };
    }

    await prisma.article.delete({ where: { id: existing.id } });
    await deleteImageQuietly(existing.imageUrl);
    revalidateNews(existing.id);

    return { ok: true, message: "Нийтлэл устгагдлаа." };
  } catch (error) {
    console.error("[admin] delete article failed", error);
    return { ok: false, message: "Нийтлэл устгахад алдаа гарлаа." };
  }
}
