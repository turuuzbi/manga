"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { BookOpenText } from "lucide-react";

export function AppAccountDock() {
  const pathname = usePathname();
  const isReader = pathname.startsWith("/reader");

  return (
    <div
      className={`fixed right-3 z-[90] sm:right-5 ${isReader ? "top-3 sm:top-5" : "top-3 sm:top-4"}`}
    >
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/70 p-1.5 pr-2 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl supports-[backdrop-filter]:bg-black/55">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-100 transition hover:bg-white/10"
          aria-label="Go home"
        >
          <BookOpenText size={18} />
        </Link>

        <SignedIn>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-zinc-100">
            <UserButton
              showName={!isReader}
              appearance={{
                elements: {
                  userButtonAvatarBox:
                    "h-9 w-9 rounded-full ring-2 ring-white/10 shadow-none",
                  userButtonTrigger:
                    "rounded-full border border-white/10 bg-transparent px-0 py-0 text-white hover:bg-white/5 focus:shadow-none",
                  userButtonOuterIdentifier:
                    "max-w-[90px] truncate text-sm font-medium text-white",
                  userButtonBox: "gap-2",
                  userButtonPopoverCard:
                    "border border-white/10 bg-zinc-950 text-white shadow-2xl",
                  userButtonPopoverFooter: "border-white/10",
                },
              }}
            />
          </div>
        </SignedIn>

        <SignedOut>
          <div className="flex items-center gap-2">
            <SignInButton>
              <button className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-100 transition hover:bg-white/10">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton>
              <button className="rounded-full bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-zinc-200">
                Join
              </button>
            </SignUpButton>
          </div>
        </SignedOut>
      </div>
    </div>
  );
}
