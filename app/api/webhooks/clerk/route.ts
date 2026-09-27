import { Webhook } from "svix";
import { headers } from "next/headers";
import { type WebhookEvent } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { AccountConflictError, syncClerkUser } from "@/lib/auth";

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

  if (!webhookSecret) {
    return new Response("Missing CLERK_WEBHOOK_SIGNING_SECRET", {
      status: 500,
    });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing Svix headers", { status: 400 });
  }

  const payload = await req.text();
  const webhook = new Webhook(webhookSecret);

  let event: WebhookEvent;

  try {
    event = webhook.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    if (event.type === "user.created" || event.type === "user.updated") {
      const email = event.data.email_addresses.find(
        ({ id }) => id === event.data.primary_email_address_id,
      )?.email_address;

      if (!email) {
        return new Response("Primary email missing", { status: 400 });
      }

      // Shared with the reader's first page load, which often runs at the
      // same moment; see lib/auth for how the two avoid colliding.
      await syncClerkUser({
        clerkId: event.data.id,
        email,
        username: event.data.username,
        avatarUrl: event.data.image_url,
      });
    }

    if (event.type === "user.deleted" && event.data.id) {
      // Marked, not deleted: removing the row would cascade to the reader's
      // payments, subscriptions and reading history, which are kept for
      // reporting. Signing up again with the same email reclaims the row.
      await prisma.user.updateMany({
        where: { clerkId: event.data.id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    }
  } catch (err) {
    if (err instanceof AccountConflictError) {
      console.error("[clerk webhook] account conflict", err.message);
      return new Response("OK", { status: 200 });
    }

    console.error("clerk webhook user sync failed", err);
    // Return 200 so Clerk stops retrying; the error is in your logs
    return new Response("OK", { status: 200 });
  }

  return new Response("OK", { status: 200 });
}
