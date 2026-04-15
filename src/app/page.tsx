import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LandingPage from "./landing-page";

interface PageProps {
  searchParams: Promise<{ step?: string; ref?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();

  // If user is logged in, go to dashboard
  const session = cookieStore.get("session")?.value;
  if (session) {
    redirect("/dashboard");
  }

  // If in the middle of auth flow, redirect to auth page
  if (params.step === "code") {
    const url = `/auth?step=code${params.ref ? `&ref=${params.ref}` : ""}`;
    redirect(url);
  }

  return <LandingPage referralCode={params.ref} />;
}
