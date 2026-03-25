import { Webhook } from "svix";
import { headers } from "next/headers";
import { type WebhookEvent } from "@clerk/nextjs/server";
import prisma from "@/lib/db";

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

  if (event.type === "user.created" || event.type === "user.updated") {
    const email = event.data.email_addresses.find(
      ({ id }) => id === event.data.primary_email_address_id,
    )?.email_address;

    if (!email) {
      return new Response("Primary email missing", { status: 400 });
    }

    await prisma.user.upsert({
      where: {
        clerkId: event.data.id,
      },
      update: {
        email,
        username: event.data.username ?? undefined,
        avatarUrl: event.data.image_url,
      },
      create: {
        clerkId: event.data.id,
        email,
        username: event.data.username ?? undefined,
        avatarUrl: event.data.image_url,
      },
    });
  }

  if (event.type === "user.deleted" && event.data.id) {
    await prisma.user.deleteMany({
      where: {
        clerkId: event.data.id,
      },
    });
  }

  return new Response("OK", { status: 200 });
}
