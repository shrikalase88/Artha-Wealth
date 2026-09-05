"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Upload, FileText, Loader2, Sparkles, CheckCircle2, Image as ImageIcon, FolderPlus, Layers, Key } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface UploadDropzoneProps {
  userId: string;
  portfolios?: any[];
}

export function UploadDropzone({ userId, portfolios = [] }: UploadDropzoneProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const queryPfId = searchParams?.get("portfolio_id") || "";

  const [activeTab, setActiveTab] = useState<"pdf" | "screenshot">("pdf");
  const [targetMode, setTargetMode] = useState<"new" | "existing">(
    queryPfId || portfolios.length > 0 ? "existing" : "new"
  );
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>(
    queryPfId || (portfolios.length > 0 ? portfolios[0].id : "")
  );
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [newPortfolioVendor, setNewPortfolioVendor] = useState("auto");
  const [geminiKey, setGeminiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem("gemini_api_key") || "";
    if (savedKey) setGeminiKey(savedKey);
  }, []);

  const handleSaveGeminiKey = (val: string) => {
    setGeminiKey(val);
    if (val.trim()) {
      localStorage.setItem("gemini_api_key", val.trim());
      toast.success("Gemini API Key saved!");
    } else {
      localStorage.removeItem("gemini_api_key");
    }
  };

  const handleUpload = useCallback(
    async (file: File) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large. Maximum size is 10MB.");
        return;
      }

      const isPdf = file.name.endsWith(".pdf");
      const isImg = /\.(png|jpe?g|webp)$/i.test(file.name);

      if (activeTab === "pdf" && !isPdf) {
        toast.error("Please upload a PDF file for statements.");
        return;
      }

      if (activeTab === "screenshot" && !isImg) {
        toast.error("Please upload an image (PNG, JPG, WEBP) for screenshots.");
        return;
      }

      if (!isPdf && !isImg) {
        toast.error("Unsupported file type.");
        return;
      }

      setUploading(true);
      setSuccess(false);

      const filePath = `${userId}/${Date.now()}_${file.name}`;

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("portfolio-statements")
        .upload(filePath, file);

      if (uploadError) {
        toast.error(uploadError.message);
        setUploading(false);
        return;
      }

      let activePfId = selectedPortfolioId;

      // Determine or create portfolio section
      if (targetMode === "new" || !activePfId) {
        const cleanName = newPortfolioName.trim() || file.name.replace(/\.[^/.]+$/, "");
        const description = newPortfolioVendor !== "auto" ? `${newPortfolioVendor} Portfolio` : null;

        const { data: newPf, error: dbError } = await supabase
          .from("portfolios")
          .insert({
            user_id: userId,
            name: cleanName,
            description,
            source_file_path: filePath,
            upload_status: "pending",
          })
          .select("id")
          .single();

        if (dbError || !newPf) {
          toast.error(dbError?.message ?? "Failed to initialize portfolio record");
          setUploading(false);
          return;
        }
        activePfId = newPf.id;
      } else {
        // Link statement file to existing portfolio
        await supabase
          .from("portfolios")
          .update({
            source_file_path: filePath,
            upload_status: "pending",
          })
          .eq("id", activePfId);
      }

      try {
        const isScreenshotMode = isImg || activeTab === "screenshot";
        const endpoint = isScreenshotMode
          ? `${BACKEND_URL}/api/v1/portfolios/parse-screenshot`
          : `${BACKEND_URL}/api/v1/portfolios/parse`;

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || "";

        const effectiveKey = geminiKey.trim() || localStorage.getItem("gemini_api_key") || "";
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        };
        if (effectiveKey) {
          headers["x-gemini-api-key"] = effectiveKey;
        }

        const res = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({
            portfolio_id: activePfId,
            user_id: userId,
            file_path: filePath,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.detail ?? "Extraction failed");
          setUploading(false);
          return;
        }

        if (data.parse_error) {
          toast.warning(`Uploaded! ${data.parse_error}`);
        } else {
          setSuccess(true);
          if (isScreenshotMode && !effectiveKey) {
            toast.success("Simulation mode: Loaded demo screenshot holdings!");
          } else {
            toast.success("Holdings extracted successfully into portfolio section!");
          }
        }
      } catch (err) {
        console.error(err);
        toast.warning("Uploaded! Backend will finish processing in the background.");
      }

      setTimeout(() => {
        router.push(`/dashboard?tab=portfolio&section=${activePfId}`);
        setUploading(false);
      }, 1200);
    },
    [userId, supabase, router, activeTab, targetMode, selectedPortfolioId, newPortfolioName, newPortfolioVendor, geminiKey],
  );

  return (
    <div className="space-y-6">
      {/* Portfolio Profile Destination Selector */}
      <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Portfolio Profile / Section
            </span>
          </div>
          {portfolios && portfolios.length > 0 && (
            <div className="flex rounded-lg bg-slate-900/80 p-0.5 border border-white/5 text-[11px]">
              <button
                type="button"
                onClick={() => setTargetMode("existing")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  targetMode === "existing"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Existing Section
              </button>
              <button
                type="button"
                onClick={() => setTargetMode("new")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  targetMode === "new"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                + New Profile
              </button>
            </div>
          )}
        </div>

        {targetMode === "existing" && portfolios && portfolios.length > 0 ? (
          <div className="space-y-1.5">
            <Label className="text-[11px] text-slate-400">Select Destination Section</Label>
            <select
              value={selectedPortfolioId}
              onChange={(e) => setSelectedPortfolioId(e.target.value)}
              className="w-full h-9 rounded-lg bg-slate-900 border border-white/10 text-xs text-white px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.description ? `— ${p.description}` : ""}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-400">Section Name</Label>
              <Input
                placeholder="e.g. Zerodha Demat, Groww MF, Retirement"
                value={newPortfolioName}
                onChange={(e) => setNewPortfolioName(e.target.value)}
                className="h-9 bg-slate-900 border-white/10 text-xs text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-400">Broker / Vendor</Label>
              <select
                value={newPortfolioVendor}
                onChange={(e) => setNewPortfolioVendor(e.target.value)}
                className="w-full h-9 rounded-lg bg-slate-900 border border-white/10 text-xs text-white px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="auto">Auto-detect from statement</option>
                <option value="Zerodha">Zerodha</option>
                <option value="Groww">Groww</option>
                <option value="CAMS / KFintech">CAMS / KFintech</option>
                <option value="Angel One">Angel One</option>
                <option value="Upstox">Upstox</option>
                <option value="ICICI Direct">ICICI Direct</option>
                <option value="HDFC Sky">HDFC Sky</option>
                <option value="INDmoney">INDmoney</option>
                <option value="Custom">Custom / Other</option>
              </select>
            </div>
          </div>
        )}

        {/* Optional Gemini Key Helper for Screenshot OCR */}
        {activeTab === "screenshot" && (
          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Key className="h-3 w-3 text-amber-400" />
                Gemini Vision OCR:
              </span>
              <button
                type="button"
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="text-blue-400 hover:underline text-[11px]"
              >
                {geminiKey ? "API Key Configured ✓ (Edit)" : "+ Add Gemini API Key"}
              </button>
            </div>
            {showKeyInput && (
              <div className="mt-2 flex gap-2">
                <Input
                  type="password"
                  placeholder="Paste AI Studio Gemini Key (AIza...)"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="h-8 bg-slate-900 border-white/10 text-xs text-white flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    handleSaveGeminiKey(geminiKey);
                    setShowKeyInput(false);
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selector Tabs */}
      <div className="flex border-b border-white/5 pb-px gap-1">
        <button
          onClick={() => !uploading && setActiveTab("pdf")}
          className={`flex items-center gap-1.5 py-2 px-4 border-b-2 text-xs font-semibold transition-all duration-200 ${
            activeTab === "pdf"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
          disabled={uploading}
        >
          <FileText className="h-3.5 w-3.5" />
          PDF CAS / Broker Statement
        </button>
        <button
          onClick={() => !uploading && setActiveTab("screenshot")}
          className={`flex items-center gap-1.5 py-2 px-4 border-b-2 text-xs font-semibold transition-all duration-200 ${
            activeTab === "screenshot"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
          disabled={uploading}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          App Screenshot
        </button>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (uploading) return;
          const file = e.dataTransfer.files[0];
          if (file) handleUpload(file);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 transition-all duration-300 min-h-[220px] ${
          dragOver
            ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/5"
            : "border-white/10 hover:border-blue-500/40 hover:bg-white/5"
        } ${uploading ? "pointer-events-none opacity-90" : ""}`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            {success ? (
              <div className="rounded-full bg-emerald-500/10 p-3.5 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-7 w-7 animate-bounce" />
              </div>
            ) : (
              <div className="rounded-full bg-blue-500/10 p-3.5 border border-blue-500/20 text-blue-400">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
            )}
            <div className="text-center">
              <p className="font-semibold text-white">
                {success ? "Success!" : activeTab === "pdf" ? "Parsing Statement..." : "Analyzing Screenshot..."}
              </p>
              <p className="mt-1 text-xs text-slate-400 font-light">
                {success
                  ? "Loading your portfolio holdings..."
                  : activeTab === "pdf"
                  ? "Extracting details from consolidated PDF stream..."
                  : "Running Gemini vision models to extract assets..."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-full bg-slate-950/60 border border-white/5 p-4 text-slate-400">
              {activeTab === "pdf" ? (
                <Upload className="h-6 w-6 text-slate-300" />
              ) : (
                <ImageIcon className="h-6 w-6 text-slate-300" />
              )}
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold text-white">
                Drop {activeTab === "pdf" ? "PDF statement" : "broker screenshot"} here, or click to browse
              </p>
              <p className="text-xs text-slate-400 font-light">
                {activeTab === "pdf"
                  ? "Securely parses CAMS, KFintech, CDSL, and NSDL statements"
                  : "Extracts stocks and mutual funds from Zerodha, Groww, INDmoney, etc."}
              </p>
            </div>
            <label className="cursor-pointer mt-2">
              <span className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-blue-400 transition-all duration-300">
                {activeTab === "pdf" ? <FileText className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                Select {activeTab === "pdf" ? "PDF File" : "Image File"}
              </span>
              <input
                type="file"
                accept={activeTab === "pdf" ? ".pdf" : "image/*"}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
              />
            </label>
          </>
        )}
      </div>
    </div>
  );
}
