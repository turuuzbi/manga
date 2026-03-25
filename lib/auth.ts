import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/db";

export async function syncCurrentClerkUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const clerkUser = await currentUser();

  if (!clerkUser?.primaryEmailAddress?.emailAddress) {
    return null;
  }

  return prisma.user.upsert({
    where: {
      clerkId: userId,
    },
    update: {
      email: clerkUser.primaryEmailAddress.emailAddress,
      username: clerkUser.username ?? undefined,
      avatarUrl: clerkUser.imageUrl,
    },
    create: {
      clerkId: userId,
      email: clerkUser.primaryEmailAddress.emailAddress,
      username: clerkUser.username ?? undefined,
      avatarUrl: clerkUser.imageUrl,
    },
  });
}

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
  const user = await getCurrentDbUser();

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return user;
}
