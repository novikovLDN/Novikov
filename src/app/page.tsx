import { cookies } from "next/headers";
import { redirect } from "next/navigation";
// Главная — «Атлас-издание» (ребрендинг 2027,
// docs/rebrand-2027/SCREEN_SCORE.md). Прежняя главная «Гратикул»
// осталась в components/graticule/Home.tsx: её шапка и футер ещё
// обслуживают непереведённые страницы.
import HomeView from "@/components/atlas/AtlasHome";

interface PageProps {
  searchParams: Promise<{ step?: string; ref?: string }>;
}

export default async function IndexRoute({ searchParams }: PageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();

  // Вошедший человек на витрине не задерживается.
  const session = cookieStore.get("session")?.value;
  if (session) {
    redirect("/dashboard");
  }

  // Середина входа по коду живёт на своей странице.
  if (params.step === "code") {
    const url = `/auth?step=code${params.ref ? `&ref=${params.ref}` : ""}`;
    redirect(url);
  }

  return <HomeView referralCode={params.ref} />;
}
