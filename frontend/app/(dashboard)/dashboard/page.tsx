import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "./dashboard-view";
import { SplashScreen } from "@/components/splash-screen";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardDataFetcher />
    </Suspense>
  );
}

async function DashboardDataFetcher() {
  let user = null;
  let portfolios = [];
  let assets = [];

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;

    if (user) {
      const [portfoliosResult, assetsResult] = await Promise.all([
        supabase
          .from("portfolios")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("assets")
          .select("*")
          .eq("user_id", user.id)
          .order("name"),
      ]);
      portfolios = portfoliosResult.data ?? [];
      assets = assetsResult.data ?? [];
    }
  } catch (err) {
    console.error("Dashboard auth error:", err);
  }

  return (
    <DashboardView
      user={user ?? null}
      portfolios={portfolios}
      assets={assets}
    />
  );
}



