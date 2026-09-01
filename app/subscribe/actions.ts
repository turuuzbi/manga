"use server";

import prisma from "@/lib/db";
import { syncCurrentClerkUser } from "@/lib/auth";
import { PLANS, isValidPlan } from "@/lib/plans";
import type { SubscriptionPlan } from "@prisma/client";

export type CheckoutState = {
  ok: boolean;
  /** True while the payment is created but not yet fulfilled (QPay pending). */
  pending: boolean;
  message: string;
  paymentId?: string;
  plan?: SubscriptionPlan;
  amount?: number;
  // Filled once QPay is wired: QR + bank deeplinks for the client to render.
  qrText?: string;
  qrImage?: string;
};

/**
 * Starts a checkout: records a PENDING payment for the chosen plan.
 *
 * NOT CURRENTLY CALLED. While QPay credentials are pending, /subscribe asks
 * readers to transfer to a bank account and send the receipt on Instagram, and
 * an admin grants access by hand — see SubscribeClient. This is kept as the
 * integration point for when QPay lands: create the invoice here and return its
 * QR/deeplinks, then have a webhook plus a status poll flip the payment to PAID
 * and activate the subscription.
 */
export async function startCheckoutAction(
  planValue: string,
): Promise<CheckoutState> {
  try {
    const user = await syncCurrentClerkUser();

    if (!user) {
      return { ok: false, pending: false, message: "Нэвтэрч орно уу." };
    }

    if (!isValidPlan(planValue)) {
      return { ok: false, pending: false, message: "Багц буруй байна." };
    }

    const plan = PLANS[planValue];

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        plan: planValue,
        amount: plan.price,
        status: "PENDING",
      },
      select: { id: true },
    });

    // TODO(qpay): create invoice via lib/qpay + return { qrText, qrImage, urls }.
    return {
      ok: true,
      pending: true,
      paymentId: payment.id,
      plan: planValue,
      amount: plan.price,
      message:
        "Төлбөрийн систем (QPay) удахгүй холбогдоно. Одоогоор багцыг админ гараар идэвхжүүлнэ.",
    };
  } catch (error) {
    return {
      ok: false,
      pending: false,
      message:
        error instanceof Error ? error.message : "Захиалга үүсгэхэд алдаа гарлаа.",
    };
  }
}
