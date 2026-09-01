import { SignIn } from "@clerk/nextjs";
import { AuthLayout } from "@/app/_components/AuthLayout";
import { authAppearance } from "@/lib/clerk-auth-ui";

export default function SignInPage() {
  return (
    <AuthLayout
      eyebrow="Welcome back"
      title={["READ", "NOW"]}
      subtitle="Бүртгэлдээ нэвтэрч уншиж байсан бүлгээсээ үргэлжлүүлээрэй."
    >
      <SignIn appearance={authAppearance} />
    </AuthLayout>
  );
}
