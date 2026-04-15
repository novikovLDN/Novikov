import { cookies } from "next/headers";
import AuthPage from "../auth-page";

interface PageProps {
  searchParams: Promise<{ step?: string; ref?: string }>;
}

export default async function Auth({ searchParams }: PageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const pendingEmail = cookieStore.get("pending_email")?.value || "";
  const initialStep = params.step === "code" && pendingEmail ? "code" : "email";

  return (
    <AuthPage
      initialStep={initialStep}
      initialEmail={pendingEmail}
      referralCode={params.ref}
    />
  );
}
