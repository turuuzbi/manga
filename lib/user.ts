import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/db";

/**
 * Returns the DB user for the currently signed-in Clerk user,
 * creating or reconciling the row if the webhook never landed.
 * Returns null if nobody is signed in.
 */
export async function getOrCreateUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId,
  )?.emailAddress;

  if (!email) return null;

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ clerkId: clerkUser.id }, { email }],
    },
  });

  if (existing) {
    // Row exists but is attached to an old/blank Clerk ID — claim it
    if (existing.clerkId !== clerkUser.id) {
      return prisma.user.update({
        where: { id: existing.id },
        data: {
          clerkId: clerkUser.id,
          email,
          avatarUrl: clerkUser.imageUrl,
        },
      });
    }
    return existing;
  }

  return prisma.user.create({
    data: {
      clerkId: clerkUser.id,
      email,
      username: clerkUser.username ?? undefined,
      avatarUrl: clerkUser.imageUrl,
    },
  });
}
