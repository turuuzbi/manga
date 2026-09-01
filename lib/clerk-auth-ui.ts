/**
 * Dark ink + gold, matching the logo. Everything shares one radius (rounded-xl)
 * and one control height (set in AuthLayout) so the social buttons and the
 * email form read as a single stack rather than competing blocks.
 */
export const authAppearance = {
  variables: {
    colorPrimary: "#c8a24c",
    colorBackground: "#141019",
    colorText: "#f3ece4",
    colorTextSecondary: "rgba(243, 236, 228, 0.58)",
    colorInputBackground: "#0e0b13",
    colorInputText: "#f3ece4",
    colorDanger: "#e2879f",
    borderRadius: "0.75rem",
    fontSize: "14px",
  },
  elements: {
    rootBox: "w-full",
    cardBox:
      "w-full rounded-2xl border border-[#c8a24c]/28 shadow-[0_30px_70px_-24px_rgba(0,0,0,0.85)]",
    card: "w-full rounded-2xl bg-[#141019] px-7 py-8",

    header: "gap-1",
    headerTitle: "text-[#f3ece4] text-2xl font-semibold tracking-tight",
    headerSubtitle: "text-[rgba(243,236,228,0.55)] text-sm",

    socialButtons: "gap-2.5",
    socialButtonsBlockButton:
      "rounded-xl border border-[#c8a24c]/25 bg-white/[0.04] text-[#f3ece4] transition hover:border-[#c8a24c]/55 hover:bg-white/[0.08] normal-case",
    socialButtonsBlockButtonText: "font-medium text-[#f3ece4]",

    dividerLine: "bg-[#c8a24c]/18",
    dividerText:
      "text-[rgba(243,236,228,0.4)] text-[10px] uppercase tracking-[0.28em]",

    formFieldLabel:
      "text-[rgba(243,236,228,0.7)] text-[11px] font-semibold uppercase tracking-[0.16em]",
    formFieldInput:
      "rounded-xl border border-[#c8a24c]/22 bg-[#0e0b13] text-[#f3ece4] placeholder:text-[rgba(243,236,228,0.32)] focus:border-[#c8a24c]/70 focus:ring-0",
    formFieldInputShowPasswordButton:
      "text-[rgba(243,236,228,0.5)] hover:text-[#e4cd93]",

    formButtonPrimary:
      "rounded-xl border-0 bg-gradient-to-r from-[#d8b56a] to-[#c8a24c] text-[#161009] font-semibold tracking-wide normal-case shadow-[0_12px_26px_-12px_rgba(200,162,76,0.85)] transition hover:brightness-108",

    footer: "bg-transparent",
    footerActionText: "text-[rgba(243,236,228,0.55)]",
    footerActionLink: "text-[#e4cd93] font-semibold hover:text-[#f6e3c4]",

    identityPreviewText: "text-[#f3ece4]",
    identityPreviewEditButton: "text-[#e4cd93]",
    formResendCodeLink: "text-[#e4cd93] font-semibold",
    otpCodeFieldInput:
      "rounded-xl border border-[#c8a24c]/25 bg-[#0e0b13] text-[#f3ece4]",

    alertText: "text-sm",
    formFieldSuccessText: "text-emerald-300",
    formFieldWarningText: "text-amber-300",
    formFieldErrorText: "text-[#e2879f]",
  },
} as const;

const commonMongolianLocalization = {
  dividerText: "эсвэл",
  formButtonPrimary: "Үргэлжлүүлэх",
  formFieldLabel__emailAddress: "Имэйл хаяг",
  formFieldLabel__password: "Нууц үг",
  formFieldLabel__firstName: "Нэр",
  formFieldLabel__lastName: "Овог",
  formFieldLabel__username: "Хэрэглэгчийн нэр",
  formFieldInputPlaceholder__emailAddress: "Имэйл хаягаа оруулна уу",
  formFieldInputPlaceholder__password: "Нууц үгээ оруулна уу",
  formFieldInputPlaceholder__firstName: "Нэр",
  formFieldInputPlaceholder__lastName: "Овог",
  formFieldInputPlaceholder__username: "Хэрэглэгчийн нэр",
  // Clerk interpolates the provider here. Hardcoding "Google" made every
  // social button say Google — a Facebook button would have read
  // "Google-ээр үргэлжлүүлэх".
  socialButtonsBlockButton: "{{provider|titleize}}-ээр үргэлжлүүлэх",
  formResendCodeLink: "Код дахин илгээх",
  badge__default: "Хөгжүүлэлтийн горим",
} as const;

export const mongolianLocalization = {
  ...commonMongolianLocalization,
  signUp: {
    start: {
      title: "Бүртгэл үүсгэх",
      subtitle: "Эхлэхийн тулд мэдээллээ бөглөнө үү.",
      actionText: "Бүртгэлтэй юу?",
      actionLink: "Нэвтрэх",
    },
    emailCode: {
      title: "Имэйлээ баталгаажуулна уу",
      subtitle: "Имэйл рүү илгээсэн баталгаажуулах кодоо оруулна уу.",
      formTitle: "Баталгаажуулах код",
      formSubtitle: "Таны имэйл рүү илгээсэн кодыг оруулна уу.",
      resendButton: "Код дахин илгээх",
    },
    continue: {
      title: "Бүртгэлээ үргэлжлүүлнэ үү",
      subtitle: "Үлдсэн мэдээллээ бөглөнө үү.",
    },
  },
  signIn: {
    start: {
      title: "Нэвтрэх",
      subtitle: "Бүртгэлдээ үргэлжлүүлэн нэвтэрнэ үү.",
      actionText: "Бүртгэлгүй юу?",
      actionLink: "Бүртгэл үүсгэх",
    },
    password: {
      title: "Нууц үгээ оруулна уу",
      subtitle: "Бүртгэл рүүгээ нэвтрэхийн тулд нууц үгээ оруулна уу.",
      actionLink: "Өөр аргаар нэвтрэх",
    },
  },
} as const;
