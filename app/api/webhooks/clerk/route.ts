import { Webhook } from "svix";
import { headers } from "next/headers";
import { type WebhookEvent } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { isUniqueViolation } from "@/lib/auth";

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

      const clerkId = event.data.id;

      const data = {
        email,
        username: event.data.username ?? undefined,
        avatarUrl: event.data.image_url,
      };

      const existingByClerkId = await prisma.user.findUnique({
        where: { clerkId },
      });

      if (existingByClerkId) {
        await prisma.user.update({
          where: { clerkId },
          data,
        });
      } else {
        const existingByEmail = await prisma.user.findUnique({
          where: { email },
        });

        if (existingByEmail) {
          // An older row already owns this email — claim it for the new Clerk account
          await prisma.user.update({
            where: { email },
            data: { ...data, clerkId },
          });
        } else {
          try {
            await prisma.user.create({
              data: { clerkId, ...data },
            });
          } catch (error) {
            // The reader's first page load created the row between our
            // lookups and this insert (lib/auth syncs on first request too).
            // Same person, so update that row instead.
            if (!isUniqueViolation(error)) {
              throw error;
            }

            await prisma.user.updateMany({
              where: { OR: [{ clerkId }, { email }] },
              data: { ...data, clerkId },
            });
          }
        }
      }
    }

    if (event.type === "user.deleted" && event.data.id) {
      await prisma.user.deleteMany({
        where: {
          clerkId: event.data.id,
        },
      });
    }
  } catch (err) {
    console.error("clerk webhook user sync failed", err);
    // Return 200 so Clerk stops retrying; the error is in your logs
    return new Response("OK", { status: 200 });
  }

  return new Response("OK", { status: 200 });
}
