export const authAppearance = {
  elements: {
    rootBox: "w-full",
    cardBox: "w-full",
    card: "w-full border-2 border-[#1a1108] bg-[#fffdf8] shadow-[8px_8px_0_#1a1108] rounded-none",
    headerTitle:
      "text-[#1a1108] text-3xl font-black tracking-tight",
    headerSubtitle: "text-[#6b594d] text-sm",
    socialButtonsBlockButton:
      "border-2 border-[#1a1108] bg-[#fffaf1] text-[#1a1108] shadow-[3px_3px_0_#1a1108] hover:bg-[#fff5e6] rounded-none font-semibold",
    socialButtonsBlockButtonText: "font-semibold text-[#1a1108]",
    dividerLine: "bg-[#1a1108]/15",
    dividerText: "text-[#8a6a57] text-xs uppercase tracking-[0.22em]",
    formFieldLabel:
      "text-[#1a1108] text-xs font-extrabold uppercase tracking-[0.2em]",
    formFieldInput:
      "rounded-none border-2 border-[#1a1108] bg-white text-[#1a1108] shadow-none focus:border-[#e8637e] focus:ring-0",
    formButtonPrimary:
      "rounded-none border-2 border-[#1a1108] bg-[#1a1108] text-[#fffaf1] shadow-[4px_4px_0_#e8637e] hover:bg-[#30241c]",
    footerActionLink: "text-[#e8637e] font-semibold",
    identityPreviewText: "text-[#1a1108]",
    formResendCodeLink: "text-[#e8637e] font-semibold",
    otpCodeFieldInput:
      "rounded-none border-2 border-[#1a1108] bg-white text-[#1a1108]",
    alertText: "text-sm",
    formFieldSuccessText: "text-emerald-700",
    formFieldWarningText: "text-amber-700",
    formFieldErrorText: "text-red-700",
    footer: "bg-[#fff8ee]",
    footerActionText: "text-[#6b594d]",
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
  socialButtonsBlockButton: "Google-ээр үргэлжлүүлэх",
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
