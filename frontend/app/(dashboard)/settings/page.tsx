"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, User, Mail, Globe, MapPin, Shield, Key, Eye, EyeOff, Loader2, Calculator } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  
  // Gemini API Key state
  const [geminiKey, setGeminiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);



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

        // Load Gemini Key from local storage
        if (typeof window !== "undefined") {
          const storedKey = localStorage.getItem("gemini_api_key") || "";
          setGeminiKey(storedKey);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase, router]);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKey(true);
    try {
      if (geminiKey.trim()) {
        localStorage.setItem("gemini_api_key", geminiKey.trim());
        toast.success("Gemini API Key saved successfully!");
      } else {
        localStorage.removeItem("gemini_api_key");
        toast.success("Gemini API Key removed.");
      }
    } catch {
      toast.error("Failed to save API key to local storage.");
    } finally {
      setSavingKey(false);
    }
  };

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
            Manage your user profile, API integrations, and security preferences
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

        {/* Gemini API Key integrations */}
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-md glass-card py-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-400" /> API Keys & Integrations
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs font-light">
              Provide credentials for advanced features like automated screenshot extraction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveKey} className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-slate-300">Google Gemini API Key</Label>
                  <a
                    href="https://aistudio.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-blue-400 hover:underline font-semibold"
                  >
                    Get Key from AI Studio →
                  </a>
                </div>
                <div className="relative">
                  <Input
                    type={showKey ? "text" : "password"}
                    placeholder="AIzaSy..."
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="bg-slate-950/60 border-white/10 pr-10 text-sm text-white h-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 font-light leading-relaxed">
                  Your key is stored securely in your local browser storage and never sent to our servers except to authenticate the Gemini OCR request. If empty, the application runs screenshot parsing in demo/mock mode.
                </p>
              </div>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
                disabled={savingKey}
              >
                {savingKey ? "Saving..." : "Save API Credentials"}
              </Button>
            </form>
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
