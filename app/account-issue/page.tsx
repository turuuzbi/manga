import type { Metadata } from "next";
import { SignOutButton } from "@clerk/nextjs";
import { Instagram } from "lucide-react";
import { AuthLayout } from "@/app/_components/AuthLayout";

export const metadata: Metadata = {
  title: "Бүртгэлийн асуудал",
  robots: { index: false, follow: false },
};

const INSTAGRAM_HANDLE = "yume_orchuulagch";

const CARD_STYLES = `
.yume-auth .yi-card {
  display: grid; gap: 16px;
  border-radius: 24px; padding: 24px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(200, 162, 76, 0.28);
  box-shadow: 0 30px 70px -30px rgba(0, 0, 0, 0.9);
  font-size: 14px; line-height: 1.7; color: rgba(243, 236, 228, 0.78);
}
.yume-auth .yi-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 46px; border-radius: 14px; padding: 0 18px;
  font-size: 14px; font-weight: 600; text-decoration: none; cursor: pointer;
}
.yume-auth .yi-btn-gold { background: linear-gradient(135deg, #e4cd93, #c8a24c); color: #2a1f0e; border: 0; }
.yume-auth .yi-btn-line { background: transparent; color: #f3ece4; border: 1px solid rgba(243, 236, 228, 0.25); }
`;

/**
 * Where ensureDbUser() sends a reader whose email already belongs to another
 * live Clerk account (lib/auth). The row is left alone and the case is logged;
 * an admin sorts it out by hand.
 */
export default function AccountIssuePage() {
  return (
    <AuthLayout
      eyebrow="Бүртгэл"
      title={["Бүртгэлийн", "асуудал"]}
      subtitle="Таны и-мэйл хаяг манай сайт дээр өөр бүртгэлтэй холбогдсон байна."
    >
      <style>{CARD_STYLES}</style>
      <div className="yi-card">
        <p>
          Та өмнө нь өөр аргаар (жишээ нь Google эсвэл и-мэйлээр) бүртгүүлсэн
          байж магадгүй. Тэр аргаараа дахин нэвтэрч үзээрэй. Асуудал
          шийдэгдэхгүй бол Instagram-аар бидэнтэй холбогдоорой, бид гараар засна.
        </p>
        <a
          href={`https://instagram.com/${INSTAGRAM_HANDLE}`}
          target="_blank"
          rel="noreferrer"
          className="yi-btn yi-btn-gold"
        >
          <Instagram size={16} />@{INSTAGRAM_HANDLE}
        </a>
        <SignOutButton redirectUrl="/sign-in">
          <button type="button" className="yi-btn yi-btn-line">
            Гарах, өөр аргаар нэвтрэх
          </button>
        </SignOutButton>
      </div>
    </AuthLayout>
  );
}
