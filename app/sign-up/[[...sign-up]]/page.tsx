import { SignUp } from "@clerk/nextjs";
import { AuthLayout } from "@/app/_components/AuthLayout";
import { authAppearance } from "@/lib/clerk-auth-ui";

export default function SignUpPage() {
  return (
    <AuthLayout
      eyebrow="New reader"
      title={["MANGA", "CLUB"]}
      subtitle="Бүртгэлээ үүсгээд шинэ бүлгүүд, хадгалсан цувралууд, уншлагын явцаа нэг дороос удирдаарай."
    >
      <SignUp appearance={authAppearance} />
    </AuthLayout>
  );
}
