import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/db";

/**
 * Finds or creates the DB row for the signed-in Clerk user.
 * Matches on clerkId OR email, so legacy rows (whose clerkId was
 * backfilled from username/id) get reclaimed instead of colliding.
 * Returns null if nobody is signed in or there's no primary email.
 */
export async function syncCurrentClerkUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress;

  if (!email) {
    return null;
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ clerkId: userId }, { email }],
    },
  });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        clerkId: userId,
        email,
        avatarUrl: clerkUser.imageUrl,
      },
    });
  }

  try {
    return await prisma.user.create({
      data: {
        clerkId: userId,
        email,
        avatarUrl: clerkUser.imageUrl,
      },
    });
  } catch (error) {
    // A brand-new reader's first page load often makes two requests at once
    // (or races the Clerk webhook). Both miss the lookup above; the loser's
    // insert hits the unique email/clerkId and used to become an error page.
    // The row now exists — use it.
    if (!isUniqueViolation(error)) {
      throw error;
    }

    const winner = await prisma.user.findFirst({
      where: { OR: [{ clerkId: userId }, { email }] },
    });

    if (!winner) {
      throw error;
    }

    return winner.clerkId === userId
      ? winner
      : prisma.user.update({
          where: { id: winner.id },
          data: { clerkId: userId, avatarUrl: clerkUser.imageUrl },
        });
  }
}

export function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "P2002"
  );
}

/**
 * Read-only lookup by clerkId. Returns null for legacy users whose
 * clerkId hasn't been reclaimed yet — call syncCurrentClerkUser()
 * if you need the row to exist.
 */
export async function getCurrentDbUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      clerkId: userId,
    },
  });
}

export async function requireAdminUser() {
  const user = await syncCurrentClerkUser();

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return user;
}
