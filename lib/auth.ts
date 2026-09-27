import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { redirect } from "next/navigation";
import type { Prisma, User } from "@prisma/client";
import prisma from "@/lib/db";

/** What the app keeps from a Clerk account. */
export type ClerkUserFields = {
  clerkId: string;
  email: string;
  /** Null or undefined leaves the stored username alone. */
  username?: string | null;
  avatarUrl: string | null;
};

/**
 * Two Clerk accounts that both still exist claim the same email. The row is
 * never handed from one live account to the other; the reader is sent to
 * /account-issue and the case is logged for an admin to sort out.
 */
export class AccountConflictError extends Error {
  constructor(email: string, ownerClerkId: string, claimantClerkId: string) {
    super(
      `email ${email} belongs to live Clerk account ${ownerClerkId}; ${claimantClerkId} claims it too`,
    );
    this.name = "AccountConflictError";
  }
}

/**
 * The database row for the signed-in reader, created on their first request
 * if the Clerk webhook has not made it yet. Null when nobody is signed in.
 *
 * Existing rows are returned as they are: profile changes (email, username,
 * avatar) arrive through the Clerk webhook, so an ordinary page load costs one
 * indexed read and no Clerk API call.
 */
export async function ensureDbUser(): Promise<User | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const existing = await prisma.user.findUnique({ where: { clerkId: userId } });

  if (existing) {
    // Marked deleted, yet this Clerk account is signed in, so it is live.
    return existing.deletedAt
      ? prisma.user.update({ where: { id: existing.id }, data: { deletedAt: null } })
      : existing;
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress;

  if (!clerkUser || !email) {
    return null;
  }

  try {
    return await syncClerkUser({
      clerkId: userId,
      email,
      username: clerkUser.username,
      avatarUrl: clerkUser.imageUrl,
    });
  } catch (error) {
    if (error instanceof AccountConflictError) {
      console.error("[auth] account conflict", error.message);
      redirect("/account-issue");
    }

    throw error;
  }
}

/**
 * Creates or refreshes the row for a Clerk account. Used by page loads
 * (ensureDbUser) and the Clerk webhook, which often run at the same moment for
 * a new reader, so every write here tolerates the other one winning:
 *
 * - The insert is INSERT … ON CONFLICT DO NOTHING, then the row is read back,
 *   whoever wrote it.
 * - If the email already belongs to a row for another Clerk ID, Clerk is asked
 *   whether that account still exists. Gone (deleted, then signed up again
 *   with the same email): the row moves to the new account, keeping its
 *   premium, payments and history. Still there: AccountConflictError, and the
 *   row is left untouched.
 */
export async function syncClerkUser(fields: ClerkUserFields): Promise<User> {
  const { clerkId, email, avatarUrl } = fields;
  const username = fields.username || undefined;

  const current = await prisma.user.findUnique({ where: { clerkId } });

  if (current) {
    return refreshProfile(current, fields);
  }

  await prisma.user.createMany({
    data: [{ clerkId, email, username, avatarUrl }],
    skipDuplicates: true,
  });

  const created = await prisma.user.findUnique({ where: { clerkId } });

  if (created) {
    return created;
  }

  const owner = await prisma.user.findUnique({ where: { email } });

  if (!owner) {
    // Nothing holds the email, so the insert was skipped over the username
    // alone (a stale row still carries it). Create without one; the webhook
    // fills it in when the name frees up.
    await prisma.user.createMany({
      data: [{ clerkId, email, avatarUrl }],
      skipDuplicates: true,
    });

    const retried = await prisma.user.findUnique({ where: { clerkId } });

    if (retried) {
      return retried;
    }

    throw new Error(`[auth] could not create a user row for ${clerkId}`);
  }

  if (await clerkAccountExists(owner.clerkId)) {
    throw new AccountConflictError(email, owner.clerkId, clerkId);
  }

  // Matching on the old clerkId too, so two requests moving the row at once
  // cannot both write; the second finds it already moved below.
  const moved = await prisma.user.updateMany({
    where: { id: owner.id, clerkId: owner.clerkId },
    data: { clerkId, avatarUrl, deletedAt: null },
  });

  if (moved.count > 0) {
    console.warn(
      `[auth] user ${owner.id} moved from deleted Clerk account ${owner.clerkId} to ${clerkId}`,
    );
  }

  const reclaimed = await prisma.user.findUnique({ where: { clerkId } });

  if (reclaimed) {
    return reclaimed;
  }

  throw new Error(`[auth] could not move user ${owner.id} to ${clerkId}`);
}

/** Brings a row's email, username and avatar up to date with Clerk. */
async function refreshProfile(row: User, fields: ClerkUserFields): Promise<User> {
  const data: Prisma.UserUpdateInput = {};

  if (row.email !== fields.email) data.email = fields.email;
  if (fields.username && row.username !== fields.username) data.username = fields.username;
  if (row.avatarUrl !== fields.avatarUrl) data.avatarUrl = fields.avatarUrl;
  if (row.deletedAt) data.deletedAt = null;

  if (Object.keys(data).length === 0) {
    return row;
  }

  try {
    return await prisma.user.update({ where: { id: row.id }, data });
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }

    // Another row still holds the new email or username. Keep this row's old
    // values for those two rather than take them from someone else.
    console.error(`[auth] user ${row.id}: new email or username is taken; kept the old ones`);

    const safe: Prisma.UserUpdateInput = {};
    if (data.avatarUrl !== undefined) safe.avatarUrl = data.avatarUrl;
    if (data.deletedAt !== undefined) safe.deletedAt = data.deletedAt;

    return Object.keys(safe).length > 0
      ? prisma.user.update({ where: { id: row.id }, data: safe })
      : row;
  }
}

async function clerkAccountExists(clerkId: string): Promise<boolean> {
  try {
    const client = await clerkClient();
    await client.users.getUser(clerkId);
    return true;
  } catch (error) {
    if (isClerkAPIResponseError(error) && error.status === 404) {
      return false;
    }

    throw error;
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
 * Read-only lookup by clerkId: never creates the row. For per-request status
 * calls where a missing row just means "treat as a new reader"; use
 * ensureDbUser() when the row must exist.
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
  const user = await ensureDbUser();

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return user;
}
