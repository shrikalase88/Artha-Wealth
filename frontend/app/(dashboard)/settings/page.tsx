"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, User, Mail, Globe, Shield, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }
        setUser(user);

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        setProfile(profile);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase, router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a13] flex items-center justify-center text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a13] p-6 lg:p-10 text-slate-100 pb-24">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Settings</h1>
          <p className="mt-1 text-sm text-slate-400 font-light">
            Manage your user profile and security preferences
          </p>
        </div>

        {/* Profile details */}
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-md glass-card py-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-white">Profile Details</CardTitle>
            <CardDescription className="text-slate-400 text-xs font-light">
              Registered profile data from authentication records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
                <User className="h-4.5 w-4.5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Full Name</p>
                <p className="font-semibold text-white mt-0.5 text-sm">{profile?.full_name ?? "—"}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Mail className="h-4.5 w-4.5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Email Address</p>
                <p className="font-semibold text-white mt-0.5 text-sm">{user?.email}</p>
              </div>
            </div>

            {profile?.country && (
              <div className="flex items-center gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Globe className="h-4.5 w-4.5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Country</p>
                  <p className="font-semibold text-white mt-0.5 text-sm">{profile.country}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security & Account */}
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-md glass-card py-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-400" /> Security & Account
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs font-light">
              Manage your active session or log out of this device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center gap-2 text-xs"
            >
              <LogOut className="h-4 w-4" />
              Log Out of Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
