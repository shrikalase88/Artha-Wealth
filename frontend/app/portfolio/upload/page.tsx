import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadDropzone } from "./upload-dropzone";
import { Info, HelpCircle, LayoutDashboard } from "lucide-react";

export default async function UploadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 pb-24 relative overflow-hidden">
      {/* Background Liquid Glass Ambient Glows */}
      <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.25)_0%,rgba(6,182,212,0.08)_40%,transparent_70%)] pointer-events-none filter blur-[80px] animate-glow-1" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.22)_0%,rgba(20,184,166,0.08)_45%,transparent_70%)] pointer-events-none filter blur-[80px] animate-glow-2" />

      {/* Top Header Bar */}
      <header className="border-b border-white/10 bg-slate-950/40 backdrop-blur-xl sticky top-0 z-40 w-full">
        <div className="mx-auto max-w-5xl flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-emerald-500 p-0.5 shadow-md shadow-blue-500/20">
              <span className="text-xs font-bold text-white">A</span>
            </div>
            <span className="text-sm font-bold tracking-tight text-white">
              Artha <span className="text-blue-500 font-medium text-[10px] tracking-wider uppercase ml-0.5">Wealth</span>
            </span>
          </div>

          <Link href="/dashboard">
            <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold flex items-center gap-1.5 h-8.5 text-white">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-8 mt-8 px-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Upload Statement</h1>
          <p className="mt-1.5 text-sm text-slate-300 font-light">
            Upload your CAS (Consolidated Account Statement) or brokerage PDF to sync your holdings
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 items-start">
          <div className="md:col-span-2">
            <Card className="border-white/5 bg-slate-900/40 backdrop-blur-md glass-card py-4">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-white">Portfolio Statement</CardTitle>
                <CardDescription className="text-slate-400 font-light">
                  Accepted formats: PDF. Maximum file size: 10MB.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UploadDropzone userId={user.id} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-white/5 bg-slate-950/40 glass-card">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-blue-400" />
                  Quick Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 text-xs text-slate-400 font-light space-y-2.5 leading-relaxed">
                <p>
                  <strong>Original PDFs:</strong> Ensure you upload the direct PDF mailed by CAMS/KFintech or NSDL/CDSL. "Printed to PDF" files cannot be parsed.
                </p>
                <p>
                  <strong>Demat Reports:</strong> We support NSDL and CDSL statements, automatically classifying stocks, mutual funds, and bonds.
                </p>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-slate-950/40 glass-card">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-blue-400" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 text-xs text-slate-400 font-light leading-relaxed">
                <p>
                  Most CAS PDFs are protected by your PAN (in CAPITAL letters) or date of birth. Our parser handles decryption locally.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
