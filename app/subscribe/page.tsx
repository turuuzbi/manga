import { getCurrentDbUser } from "@/lib/auth";
import { PLANS, PLAN_ORDER, isPremium, isValidPlan } from "@/lib/plans";
import { AppAccountDock } from "@/app/_components/AppAccountDock";
import { SubscribeClient } from "@/app/subscribe/SubscribeClient";

export const dynamic = "force-dynamic";

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Marcellus&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
.yume-subscribe { font-family: 'Plus Jakarta Sans', sans-serif; }
.yume-subscribe * { box-sizing: border-box; }
`;

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const user = await getCurrentDbUser();

  const initialPlan = plan && isValidPlan(plan) ? plan : "ONE_MONTH";
  const plans = PLAN_ORDER.map((key) => ({
    plan: key,
    label: PLANS[key].label,
    price: PLANS[key].price,
    days: PLANS[key].days,
    perDay: Math.round(PLANS[key].price / PLANS[key].days),
  }));

  return (
    <div className="yume-surface yume-subscribe min-h-screen">
      <style>{FONTS}</style>
      <AppAccountDock isAdmin={user?.role === "ADMIN"} />
      <SubscribeClient
        plans={plans}
        initialPlan={initialPlan}
        isPremium={isPremium(user)}
        premiumUntilLabel={
          user?.premiumUntil ? user.premiumUntil.toLocaleDateString() : null
        }
        // Shown so the reader sends the admin the exact address the grant form
        // searches for, whichever provider they signed up with.
        accountEmail={user?.email ?? null}
      />
    </div>
  );
}
