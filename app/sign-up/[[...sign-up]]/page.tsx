import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import { authAppearance } from "@/lib/clerk-auth-ui";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-[#fffdf8] px-4 py-10 text-[#1a1108]">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,rgba(38,31,25,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(38,31,25,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.94),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(243,239,233,0.45),transparent_30%)]" />

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-10 py-10 lg:grid lg:grid-cols-[0.95fr_0.85fr] lg:items-center">
        <section className="space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#6a584c] transition hover:text-[#1e1813]"
          >
            <ArrowLeft size={16} />
            Нүүр хуудас руу буцах
          </Link>
          <div className="space-y-4">
            <div className="inline-flex border-2 border-[#1a1108] bg-[#f5c518] px-3 py-1 shadow-[3px_3px_0_#1a1108]">
              <span className="text-xs font-extrabold uppercase tracking-[0.24em]">
                New Reader
              </span>
            </div>
            <h1
              className="text-[#1a1108]"
              style={{
                fontFamily: "Bangers, cursive",
                fontSize: "clamp(3rem, 8vw, 5.5rem)",
                lineHeight: 0.9,
                letterSpacing: "0.05em",
                textShadow: "3px 3px 0 #e8637e",
              }}
            >
              MANGA
              <br />
              CLUB
            </h1>
            <p className="max-w-lg text-sm leading-7 text-[#5f5146] sm:text-base">
              Бүртгэлээ үүсгээд шинэ бүлгүүд, хадгалсан цувралууд, уншлагын
              явцаа нэг дороос удирдаарай.
            </p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-md">
          <SignUp appearance={authAppearance} />
        </div>
      </div>
    </main>
  );
}
