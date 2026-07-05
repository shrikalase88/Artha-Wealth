import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Shield,
  BarChart3,
  ArrowRight,
  Lock,
} from "lucide-react";
import { DashboardView } from "./dashboard-view";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let portfolios = [];
  let assets = [];

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

  return (
    <DashboardView
      user={user ?? null}
      portfolios={portfolios}
      assets={assets}
    />
  );
}


