"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Upload, FileText, Loader2, Sparkles, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export function UploadDropzone({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();
  
  const [activeTab, setActiveTab] = useState<"pdf" | "screenshot">("pdf");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [success, setSuccess] = useState(false);

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

      // Create new portfolio record
      const { data: portfolio, error: dbError } = await supabase
        .from("portfolios")
        .insert({
          user_id: userId,
          name: file.name.replace(/\.[^/.]+$/, ""), // strip extension
          source_file_path: filePath,
          upload_status: "pending",
        })
        .select("id")
        .single();

      if (dbError || !portfolio) {
        toast.error(dbError?.message ?? "Failed to initialize portfolio upload record");
        setUploading(false);
        return;
      }

      try {
        const isScreenshotMode = isImg || activeTab === "screenshot";
        const endpoint = isScreenshotMode
          ? `${BACKEND_URL}/api/v1/portfolios/parse-screenshot`
          : `${BACKEND_URL}/api/v1/portfolios/parse`;

        // Fetch current active Supabase Auth Session access token
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || "";

        // Check for local Gemini Key
        const localGeminiKey = localStorage.getItem("gemini_api_key") || "";
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        };
        if (localGeminiKey) {
          headers["x-gemini-api-key"] = localGeminiKey;
        }

        const res = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({
            portfolio_id: portfolio.id,
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
          if (isScreenshotMode && !localGeminiKey) {
            toast.success("Simulation mode: Loaded demo screenshot holdings!");
          } else {
            toast.success("Holdings extracted successfully!");
          }
        }
      } catch (err) {
        console.error(err);
        toast.warning("Uploaded! Backend will finish processing in the background.");
      }

      setTimeout(() => {
        router.push("/dashboard");
        setUploading(false);
      }, 1200);
    },
    [userId, supabase, router, activeTab],
  );

  return (
    <div className="space-y-6">
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
          PDF CAS Statement
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
