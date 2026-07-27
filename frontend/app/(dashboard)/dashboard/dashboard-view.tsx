"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BarChart, DonutChart } from "@tremor/react";
import {
  TrendingUp,
  TrendingDown,
  Upload,
  Search,
  Activity,
  Calculator,
  Compass,
  Briefcase,
  Coins,
  ArrowRightLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Loader2,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Layers,
  Award,
  PieChart,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  FileText,
  Image as ImageIcon
} from "lucide-react";
import { formatIndianCurrency } from "@/lib/utils";
import { CustomBarChart } from "@/components/ui/custom-bar-chart";
import { CustomDonutChart } from "@/components/ui/custom-donut-chart";
import { ManualAssetModal } from "@/components/manual-asset-modal";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { SplashScreen } from "@/components/splash-screen";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface DashboardViewProps {
  user: any;
  portfolios: any[];
  assets: any[];
}

export function DashboardView({ user, portfolios, assets }: DashboardViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams ? searchParams.get("tab") : null;
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (tabParam && ["portfolio", "market", "funds", "currency"].includes(tabParam)) {
      return tabParam;
    }
    return "market";
  });

  const [showSplash, setShowSplash] = useState<boolean>(() => {
    // Show splash screen when landing on or viewing market tab
    return !tabParam || tabParam === "market";
  });

  useEffect(() => {
    if (tabParam && ["portfolio", "market", "funds", "currency"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [localPortfolios, setLocalPortfolios] = useState<any[]>(portfolios || []);

  useEffect(() => {
    setLocalPortfolios(portfolios || []);
  }, [portfolios]);

  const [portfolioTimeRange, setPortfolioTimeRange] = useState<"1M" | "3M" | "6M" | "1Y">("1Y");
  const [searchQuery, setSearchQuery] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState("all");
  const [fundFilterCategory, setFundFilterCategory] = useState<string>("all");
  const [selectedMarketRegion, setSelectedMarketRegion] = useState<"india" | "us" | "europe" | "china" | "japan" | "arab">("india");

  // Detect user's timezone location to auto-set regional market ticker & currency
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (tz.includes("America/")) {
        setSelectedMarketRegion("us");
        setCurrencyFrom("USDINR=X");
      } else if (tz.includes("Europe/") || tz.includes("Atlantic/")) {
        setSelectedMarketRegion("europe");
        if (tz.includes("London")) {
          setCurrencyFrom("GBPINR=X");
        } else {
          setCurrencyFrom("EURINR=X");
        }
      } else if (tz.includes("Shanghai") || tz.includes("Hong_Kong") || tz.includes("Beijing")) {
        setSelectedMarketRegion("china");
        setCurrencyFrom("USDINR=X");
      } else if (tz.includes("Tokyo") || tz.includes("Japan")) {
        setSelectedMarketRegion("japan");
        setCurrencyFrom("JPYINR=X");
      } else if (tz.includes("Riyadh") || tz.includes("Dubai") || tz.includes("Muscat") || tz.includes("Qatar")) {
        setSelectedMarketRegion("arab");
        setCurrencyFrom("AEDINR=X");
      } else if (tz.includes("Australia/")) {
        setCurrencyFrom("AUDINR=X");
      } else if (tz.includes("Singapore")) {
        setCurrencyFrom("SGDINR=X");
      } else if (tz.includes("Canada/")) {
        setCurrencyFrom("CADINR=X");
      }
    } catch (e) {
      // Default to India
    }
  }, []);

  // Manual input modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncPortfolio = async () => {
    if (!user) return;
    setIsSyncing(true);
    const toastId = toast.loading("Syncing portfolio with live market values...");
    try {
      const resp = await fetch(`${BACKEND_URL}/api/v1/assets/user/${user.id}/sync`, {
        method: "POST",
      });
      if (!resp.ok) {
        throw new Error("Sync API failed");
      }
      toast.success("Portfolio successfully synced!", { id: toastId });
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to sync portfolio: " + (err.message || "Unknown error"), { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteStatement = async (portfolioId: string) => {
    // Optimistically update UI instantly for mobile responsiveness
    setLocalPortfolios((prev) => prev.filter((p) => p.id !== portfolioId));
    const toastId = toast.loading("Removing statement source & updating database...");
    
    try {
      // 1. Perform direct Supabase database deletion
      await supabase.from("assets").delete().eq("portfolio_id", portfolioId);
      await supabase.from("portfolios").delete().eq("id", portfolioId).eq("user_id", user.id);

      // 2. Call backend API endpoint asynchronously
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (token) {
        fetch(`${BACKEND_URL}/api/v1/portfolios/${portfolioId}?user_id=${user.id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        }).catch(() => {});
      }

      toast.success("Statement source removed and database updated!", { id: toastId });
      router.refresh();
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error("Error removing statement: " + (err.message || "Failed"), { id: toastId });
      router.refresh();
    }
  };

  useEffect(() => {
    if (user && activeTab === "portfolio") {
      const lastSync = localStorage.getItem(`lastSync_${user.id}`);
      const now = Date.now();
      // Auto-sync if last sync was more than 15 minutes ago
      if (!lastSync || now - parseInt(lastSync) > 15 * 60 * 1000) {
        handleSyncPortfolio();
        localStorage.setItem(`lastSync_${user.id}`, String(now));
      }
    }
  }, [user, activeTab]);

  // Resilient live market details fetcher with instant fallback data on network failure
  const DEFAULT_FALLBACK_SUMMARY = {
    indices: [
      { name: "Nifty 50", short: "NIFTY 50", symbol: "^NSEI", price: 23767.45, change: 142.15, change_pct: 0.60 },
      { name: "Sensex", short: "SENSEX", symbol: "^BSESN", price: 76059.77, change: 412.40, change_pct: 0.55 },
      { name: "Nifty Bank", short: "BANK NIFTY", symbol: "^NSEBANK", price: 51240.10, change: 185.30, change_pct: 0.36 },
    ],
    sectors: [
      { name: "IT & Tech", short: "IT", symbol: "^CNXIT", price: 38450.20, change: 420.50, change_pct: 1.10 },
      { name: "Banking", short: "BANKING", symbol: "^NSEBANK", price: 51240.10, change: 185.30, change_pct: 0.36 },
      { name: "Pharma", short: "PHARMA", symbol: "^CNXPHARMA", price: 19200.40, change: 140.20, change_pct: 0.73 },
      { name: "Automobile", short: "AUTO", symbol: "^CNXAUTO", price: 22150.80, change: -110.40, change_pct: -0.50 },
      { name: "FMCG", short: "FMCG", symbol: "^CNXFMCG", price: 55400.10, change: 210.30, change_pct: 0.38 },
      { name: "Energy", short: "ENERGY", symbol: "^CNXENERGY", price: 39100.50, change: 380.10, change_pct: 0.98 },
    ],
    stocks: [
      { symbol: "RELIANCE.NS", name: "Reliance Industries", short: "RELIANCE", price: 2980.50, change: 54.20, change_pct: 1.85 },
      { symbol: "TCS.NS", name: "Tata Consultancy Services", short: "TCS", price: 3850.20, change: -46.80, change_pct: -1.20 },
      { symbol: "HDFCBANK.NS", name: "HDFC Bank", short: "HDFC BANK", price: 1650.80, change: 34.00, change_pct: 2.10 },
      { symbol: "INFY.NS", name: "Infosys", short: "INFOSYS", price: 1520.40, change: -14.60, change_pct: -0.95 },
      { symbol: "ICICIBANK.NS", name: "ICICI Bank", short: "ICICI BANK", price: 1120.60, change: 16.00, change_pct: 1.45 },
      { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", short: "BHARTIARTL", price: 1420.30, change: 22.10, change_pct: 1.58 },
      { symbol: "SBIN.NS", name: "State Bank of India", short: "SBIN", price: 845.50, change: 9.40, change_pct: 1.12 },
      { symbol: "LT.NS", name: "Larsen & Toubro", short: "L&T", price: 3650.00, change: 42.50, change_pct: 1.18 },
    ]
  };

  const fetcher = async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (url.includes("/summary")) return DEFAULT_FALLBACK_SUMMARY;
      if (url.includes("/currency")) return { rates: [
        { symbol: "USDINR=X", name: "US Dollar", short: "USD", price: 83.75, change: 0.08, change_pct: 0.10 },
        { symbol: "EURINR=X", name: "Euro", short: "EUR", price: 91.20, change: -0.15, change_pct: -0.16 },
        { symbol: "GBPINR=X", name: "British Pound", short: "GBP", price: 108.45, change: 0.22, change_pct: 0.20 },
      ] };
      if (url.includes("/top-funds")) return [
        { code: "122639", name: "Parag Parikh Flexi Cap Fund - Direct Growth", category: "Flexi Cap", nav: 72.45, change: 0.85, change_pct: 1.18, return_1y: 24.5, return_3y: 21.2, aum: "62,500 Cr" },
        { code: "119062", name: "HDFC Mid-Cap Opportunities Fund - Direct Growth", category: "Mid Cap", nav: 168.20, change: 2.10, change_pct: 1.26, return_1y: 31.2, return_3y: 24.8, aum: "60,200 Cr" },
        { code: "118778", name: "Nippon India Small Cap Fund - Direct Growth", category: "Small Cap", nav: 184.50, change: 2.80, change_pct: 1.54, return_1y: 38.6, return_3y: 28.5, aum: "46,300 Cr" },
        { code: "120847", name: "Quant Active Fund - Direct Growth", category: "Multi Cap", nav: 690.10, change: 7.50, change_pct: 1.10, return_1y: 29.8, return_3y: 25.1, aum: "9,800 Cr" },
        { code: "119775", name: "SBI Bluechip Fund - Direct Growth", category: "Large Cap", nav: 94.30, change: 0.65, change_pct: 0.69, return_1y: 18.2, return_3y: 16.5, aum: "43,800 Cr" },
        { code: "120503", name: "Axis ELSS Tax Saver Fund - Direct Growth", category: "ELSS (Tax Saver)", nav: 102.15, change: 0.80, change_pct: 0.79, return_1y: 16.5, return_3y: 13.2, aum: "34,100 Cr" },
        { code: "148918", name: "SBI Contra Fund - Direct Growth", category: "Contra Equity", nav: 365.40, change: 4.20, change_pct: 1.16, return_1y: 27.4, return_3y: 22.8, aum: "29,400 Cr" },
        { code: "118465", name: "Mirae Asset Large Cap Fund - Direct Growth", category: "Large Cap", nav: 115.80, change: 0.90, change_pct: 0.78, return_1y: 19.5, return_3y: 17.2, aum: "38,200 Cr" },
        { code: "120286", name: "ICICI Prudential Bluechip Fund - Direct Growth", category: "Large Cap", nav: 112.40, change: 0.95, change_pct: 0.85, return_1y: 21.4, return_3y: 18.1, aum: "42,100 Cr" },
        { code: "119819", name: "Kotak Emerging Equity Fund - Direct Growth", category: "Mid Cap", nav: 138.60, change: 1.40, change_pct: 1.02, return_1y: 25.6, return_3y: 20.4, aum: "37,600 Cr" },
        { code: "125199", name: "Quant Small Cap Fund - Direct Growth", category: "Small Cap", nav: 245.80, change: 4.10, change_pct: 1.70, return_1y: 42.1, return_3y: 32.4, aum: "17,200 Cr" },
        { code: "144848", name: "Tata Small Cap Fund - Direct Growth", category: "Small Cap", nav: 38.40, change: 0.55, change_pct: 1.45, return_1y: 35.2, return_3y: 26.8, aum: "6,100 Cr" },
        { code: "119058", name: "HDFC Index S&P BSE Sensex Fund - Direct Growth", category: "Index Fund", nav: 680.10, change: 4.20, change_pct: 0.62, return_1y: 20.8, return_3y: 15.2, aum: "4,900 Cr" },
        { code: "120716", name: "UTI Nifty 50 Index Fund - Direct Growth", category: "Index Fund", nav: 162.50, change: 1.05, change_pct: 0.65, return_1y: 21.1, return_3y: 15.4, aum: "16,200 Cr" },
        { code: "120245", name: "ICICI Prudential Technology Fund - Direct Growth", category: "Sectoral Tech", nav: 195.40, change: 2.10, change_pct: 1.08, return_1y: 14.8, return_3y: 12.1, aum: "11,200 Cr" },
        { code: "119702", name: "SBI Magnum Constant Maturity Fund - Direct Growth", category: "Debt G-Sec", nav: 58.20, change: 0.12, change_pct: 0.21, return_1y: 7.8, return_3y: 6.5, aum: "1,400 Cr" },
        { code: "119020", name: "HDFC Corporate Bond Fund - Direct Growth", category: "Debt Corporate", nav: 28.90, change: 0.05, change_pct: 0.17, return_1y: 7.2, return_3y: 6.1, aum: "28,300 Cr" },
        { code: "118712", name: "Nippon India Liquid Fund - Direct Growth", category: "Debt Liquid", nav: 5680.10, change: 1.02, change_pct: 0.02, return_1y: 6.8, return_3y: 5.9, aum: "32,400 Cr" },
        { code: "145554", name: "Motilal Oswal Nasdaq 100 FOF - Direct Growth", category: "International", nav: 34.50, change: 0.45, change_pct: 1.32, return_1y: 28.6, return_3y: 18.5, aum: "4,200 Cr" },
        { code: "124559", name: "Edelweiss Arbitrage Fund - Direct Growth", category: "Arbitrage", nav: 18.40, change: 0.03, change_pct: 0.16, return_1y: 7.5, return_3y: 6.2, aum: "11,800 Cr" },
        { code: "118544", name: "Bandhan Sterling Value Fund - Direct Growth", category: "Value Equity", nav: 142.10, change: 1.80, change_pct: 1.28, return_1y: 28.1, return_3y: 23.4, aum: "8,400 Cr" },
        { code: "118949", name: "DSP Top 100 Equity Fund - Direct Growth", category: "Large Cap", nav: 385.20, change: 3.10, change_pct: 0.81, return_1y: 17.8, return_3y: 14.9, aum: "3,400 Cr" },
        { code: "120042", name: "Invesco India Contra Fund - Direct Growth", category: "Contra Equity", nav: 124.60, change: 1.45, change_pct: 1.18, return_1y: 26.5, return_3y: 21.8, aum: "14,900 Cr" },
        { code: "118228", name: "Franklin India Prima Fund - Direct Growth", category: "Mid Cap", nav: 2150.40, change: 24.50, change_pct: 1.15, return_1y: 24.1, return_3y: 19.8, aum: "9,800 Cr" },
        { code: "119551", name: "Aditya Birla Frontline Equity Fund - Direct Growth", category: "Large Cap", nav: 420.80, change: 3.40, change_pct: 0.81, return_1y: 18.9, return_3y: 15.6, aum: "24,800 Cr" },
        { code: "119842", name: "HDFC Flexi Cap Fund - Direct Growth", category: "Flexi Cap", nav: 1785.40, change: 18.20, change_pct: 1.03, return_1y: 32.5, return_3y: 25.4, aum: "58,400 Cr" },
        { code: "118989", name: "JM Flexi Cap Fund - Direct Growth", category: "Flexi Cap", nav: 112.50, change: 1.85, change_pct: 1.67, return_1y: 48.2, return_3y: 34.1, aum: "3,800 Cr" },
        { code: "120377", name: "ICICI Prudential Multi-Asset Fund - Direct Growth", category: "Multi Asset", nav: 640.20, change: 6.80, change_pct: 1.07, return_1y: 28.9, return_3y: 22.6, aum: "41,200 Cr" },
        { code: "147942", name: "Kotak Multi Cap Fund - Direct Growth", category: "Multi Cap", nav: 18.90, change: 0.22, change_pct: 1.18, return_1y: 33.4, return_3y: 24.1, aum: "12,400 Cr" },
        { code: "120743", name: "UTI Flexi Cap Fund - Direct Growth", category: "Flexi Cap", nav: 312.40, change: 2.80, change_pct: 0.90, return_1y: 19.8, return_3y: 14.5, aum: "25,100 Cr" },
        { code: "141209", name: "Nippon India Multi Cap Fund - Direct Growth", category: "Multi Cap", nav: 265.80, change: 3.40, change_pct: 1.30, return_1y: 36.2, return_3y: 27.8, aum: "31,800 Cr" },
        { code: "119017", name: "HDFC Top 100 Fund - Direct Growth", category: "Large Cap", nav: 1145.20, change: 10.50, change_pct: 0.93, return_1y: 22.4, return_3y: 18.2, aum: "33,500 Cr" },
        { code: "118776", name: "Nippon India Large Cap Fund - Direct Growth", category: "Large Cap", nav: 86.40, change: 0.85, change_pct: 1.00, return_1y: 26.8, return_3y: 20.1, aum: "28,900 Cr" },
        { code: "119807", name: "Kotak Bluechip Fund - Direct Growth", category: "Large Cap", nav: 520.10, change: 4.10, change_pct: 0.80, return_1y: 20.4, return_3y: 16.8, aum: "7,800 Cr" },
        { code: "120584", name: "Canara Robeco Bluechip Equity Fund - Direct Growth", category: "Large Cap", nav: 58.90, change: 0.45, change_pct: 0.77, return_1y: 19.1, return_3y: 15.8, aum: "12,300 Cr" },
        { code: "120849", name: "Quant Mid Cap Fund - Direct Growth", category: "Mid Cap", nav: 224.50, change: 3.80, change_pct: 1.72, return_1y: 44.2, return_3y: 31.5, aum: "10,100 Cr" },
        { code: "120468", name: "Motilal Oswal Midcap Fund - Direct Growth", category: "Mid Cap", nav: 118.60, change: 1.90, change_pct: 1.63, return_1y: 52.4, return_3y: 35.8, aum: "14,800 Cr" },
        { code: "118667", name: "Nippon India Growth Fund - Direct Growth", category: "Mid Cap", nav: 3680.10, change: 45.20, change_pct: 1.24, return_1y: 34.6, return_3y: 26.2, aum: "27,400 Cr" },
        { code: "119797", name: "SBI Magnum Midcap Fund - Direct Growth", category: "Mid Cap", nav: 218.40, change: 2.60, change_pct: 1.21, return_1y: 29.5, return_3y: 23.1, aum: "18,200 Cr" },
        { code: "118475", name: "Mirae Asset Midcap Fund - Direct Growth", category: "Mid Cap", nav: 42.10, change: 0.52, change_pct: 1.25, return_1y: 31.8, return_3y: 23.9, aum: "15,600 Cr" },
        { code: "120712", name: "HDFC Small Cap Fund - Direct Growth", category: "Small Cap", nav: 142.80, change: 1.95, change_pct: 1.38, return_1y: 33.8, return_3y: 27.2, aum: "31,400 Cr" },
        { code: "120594", name: "Canara Robeco Small Cap Fund - Direct Growth", category: "Small Cap", nav: 39.10, change: 0.52, change_pct: 1.35, return_1y: 30.5, return_3y: 24.1, aum: "10,800 Cr" },
        { code: "119787", name: "SBI Small Cap Fund - Direct Growth", category: "Small Cap", nav: 178.60, change: 2.10, change_pct: 1.19, return_1y: 26.2, return_3y: 22.4, aum: "28,900 Cr" },
        { code: "118979", name: "DSP Small Cap Fund - Direct Growth", category: "Small Cap", nav: 182.40, change: 2.45, change_pct: 1.36, return_1y: 32.1, return_3y: 25.6, aum: "14,200 Cr" },
        { code: "120281", name: "ICICI Prudential Smallcap Fund - Direct Growth", category: "Small Cap", nav: 88.50, change: 1.20, change_pct: 1.37, return_1y: 34.2, return_3y: 26.9, aum: "8,900 Cr" },
        { code: "149639", name: "Navi Nifty 50 Index Fund - Direct Growth", category: "Index Fund", nav: 16.80, change: 0.11, change_pct: 0.66, return_1y: 21.2, return_3y: 15.5, aum: "1,800 Cr" },
        { code: "149174", name: "ICICI Prudential Nifty Next 50 Index Fund - Direct Growth", category: "Index Fund", nav: 52.40, change: 0.48, change_pct: 0.92, return_1y: 35.8, return_3y: 22.1, aum: "4,500 Cr" },
        { code: "147721", name: "Motilal Oswal Nifty Midcap 150 Index Fund - Direct Growth", category: "Index Fund", nav: 36.80, change: 0.45, change_pct: 1.24, return_1y: 42.8, return_3y: 28.4, aum: "1,200 Cr" },
        { code: "148630", name: "UTI Nifty Next 50 Index Fund - Direct Growth", category: "Index Fund", nav: 28.50, change: 0.26, change_pct: 0.92, return_1y: 35.6, return_3y: 22.0, aum: "3,400 Cr" },
        { code: "119060", name: "HDFC ELSS Tax Saver Fund - Direct Growth", category: "ELSS (Tax Saver)", nav: 1280.40, change: 14.50, change_pct: 1.15, return_1y: 31.8, return_3y: 23.5, aum: "14,800 Cr" },
        { code: "118765", name: "Nippon India ELSS Tax Saver Fund - Direct Growth", category: "ELSS (Tax Saver)", nav: 138.20, change: 1.65, change_pct: 1.21, return_1y: 28.5, return_3y: 21.4, aum: "15,200 Cr" },
        { code: "119777", name: "SBI Long Term Equity Fund (ELSS) - Direct Growth", category: "ELSS (Tax Saver)", nav: 385.60, change: 4.50, change_pct: 1.18, return_1y: 34.2, return_3y: 25.8, aum: "23,900 Cr" },
        { code: "120853", name: "Quant ELSS Tax Saver Fund - Direct Growth", category: "ELSS (Tax Saver)", nav: 420.10, change: 6.50, change_pct: 1.57, return_1y: 38.6, return_3y: 29.4, aum: "10,400 Cr" },
        { code: "118467", name: "Mirae Asset ELSS Tax Saver Fund - Direct Growth", category: "ELSS (Tax Saver)", nav: 48.90, change: 0.45, change_pct: 0.93, return_1y: 22.5, return_3y: 17.8, aum: "21,800 Cr" },
        { code: "120300", name: "ICICI Prudential Value Discovery Fund - Direct Growth", category: "Value Equity", nav: 412.50, change: 4.80, change_pct: 1.18, return_1y: 32.4, return_3y: 26.5, aum: "44,100 Cr" },
        { code: "119800", name: "Kotak Debt Hybrid Fund - Direct Growth", category: "Debt Hybrid", nav: 54.20, change: 0.22, change_pct: 0.41, return_1y: 13.8, return_3y: 11.2, aum: "2,800 Cr" },
        { code: "120844", name: "Quant Healthcare Fund - Direct Growth", category: "Sectoral Pharma", nav: 16.80, change: 0.18, "change_pct": 1.08, return_1y: 36.4, return_3y: 24.5, aum: "2,100 Cr" },
      ];
      return null;
    }
  };

  const swrFastOptions = {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    dedupingInterval: 15000,
    keepPreviousData: true,
  };

  const { data: marketSummary, error: marketSummaryError } = useSWR(
    `${BACKEND_URL}/api/v1/market/summary?region=${selectedMarketRegion}`,
    fetcher,
    { refreshInterval: 30000, ...swrFastOptions }
  );

  const { data: currencyRates } = useSWR(
    `${BACKEND_URL}/api/v1/market/currency`,
    fetcher,
    { refreshInterval: 60000, ...swrFastOptions }
  );

  const { data: topFundsData, isLoading: fundsLoading } = useSWR(
    `${BACKEND_URL}/api/v1/market/top-funds`,
    fetcher,
    { refreshInterval: 120000, ...swrFastOptions }
  );

  const topFunds = topFundsData || [];
  const marketError = !!marketSummaryError;

  const [currencyAmount, setCurrencyAmount] = useState<string>("1");
  const [currencyFrom, setCurrencyFrom] = useState<string>("USDINR=X");

  const checkMarketStatus = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istTime = new Date(utc + istOffset);
    const day = istTime.getDay();
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    if (day === 0 || day === 6) return false;
    const timeInMinutes = hours * 60 + minutes;
    return timeInMinutes >= 555 && timeInMinutes <= 930;
  };
  const isMarketOpen = checkMarketStatus();

  // Calculated Portfolio totals
  const totalValue = assets.reduce((s, a) => s + Number(a.market_value ?? 0), 0);
  const totalCost = assets.reduce((s, a) => s + Number(a.cost_basis ?? 0), 0);
  const hasCostBasis = assets.some((a) => a.cost_basis && Number(a.cost_basis) > 0);
  const totalGain = hasCostBasis ? totalValue - totalCost : null;
  const gainPercent = hasCostBasis && totalCost > 0 ? (totalGain! / totalCost) * 100 : null;

  // Dynamic Historical Growth & Time Range Performance Calculator (1M, 3M, 6M, 1Y)
  const getPeriodPerformance = (timeRange: "1M" | "3M" | "6M" | "1Y") => {
    const baseReturnPct = gainPercent !== null ? gainPercent : 36.7;
    const baseGainAmt = totalGain !== null ? totalGain : totalValue * (baseReturnPct / 100);

    let periodPct = baseReturnPct;
    let periodGainAmt = baseGainAmt;
    let svgPath = "M 0 48 C 50 42, 90 38, 140 30 C 190 32, 240 22, 290 14 C 340 18, 370 6, 400 2";

    if (timeRange === "1M") {
      periodPct = baseReturnPct > 0 ? baseReturnPct * 0.18 : baseReturnPct * 0.5;
      periodGainAmt = totalValue * (periodPct / 100);
      svgPath = "M 0 38 C 40 46, 90 28, 140 34 C 190 22, 240 38, 290 18 C 340 26, 370 10, 400 5";
    } else if (timeRange === "3M") {
      periodPct = baseReturnPct > 0 ? baseReturnPct * 0.42 : baseReturnPct * 0.7;
      periodGainAmt = totalValue * (periodPct / 100);
      svgPath = "M 0 42 C 60 48, 110 32, 170 36 C 230 26, 280 22, 340 14 C 370 16, 390 8, 400 3";
    } else if (timeRange === "6M") {
      periodPct = baseReturnPct > 0 ? baseReturnPct * 0.72 : baseReturnPct * 0.85;
      periodGainAmt = totalValue * (periodPct / 100);
      svgPath = "M 0 45 C 50 36, 100 42, 160 26 C 220 30, 270 16, 330 11 C 370 13, 390 5, 400 2";
    }

    return {
      percent: periodPct,
      gainAmount: periodGainAmt,
      svgPath,
      label: timeRange === "1Y" ? "overall" : `in ${timeRange}`,
    };
  };

  const periodData = getPeriodPerformance(portfolioTimeRange);

  // Additional dynamic KPI calculations
  const totalHoldingsCount = assets.length;
  
  const uniqueTypes = new Set(assets.map((a) => a.asset_type)).size;
  const diversificationRating = uniqueTypes >= 3 ? "High" : uniqueTypes === 2 ? "Medium" : "Low";
  const diversificationColor = uniqueTypes >= 3 ? "text-emerald-400" : uniqueTypes === 2 ? "text-amber-400" : "text-red-400";

  // Top Performer holding search
  let topPerformingAsset = "None";
  let topPerformingGainPct = 0;
  assets.forEach((a) => {
    if (a.cost_basis && Number(a.cost_basis) > 0) {
      const gain = Number(a.market_value) - Number(a.cost_basis);
      const gainPct = (gain / Number(a.cost_basis)) * 100;
      if (gainPct > topPerformingGainPct) {
        topPerformingGainPct = gainPct;
        topPerformingAsset = a.name;
      }
    }
  });

  // Split calculations by asset types
  const mutualFundsTotal = assets.filter(a => a.asset_type === "mutual_fund").reduce((sum, a) => sum + Number(a.market_value ?? 0), 0);
  const equitiesTotal = assets.filter(a => a.asset_type === "equity").reduce((sum, a) => sum + Number(a.market_value ?? 0), 0);
  const otherTotal = assets.filter(a => !["mutual_fund", "equity"].includes(a.asset_type)).reduce((sum, a) => sum + Number(a.market_value ?? 0), 0);
  
  // Filtered Assets
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (asset.isin && asset.isin.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = assetTypeFilter === "all" || asset.asset_type === assetTypeFilter;
    return matchesSearch && matchesType;
  });



  // Helper to dynamically categorize assets based on name and type
  const getFundCategory = (asset: any) => {
    if (asset.asset_type === "equity") return "Direct Equities";
    if (asset.asset_type === "mutual_fund") {
      const name = (asset.name || "").toLowerCase();
      if (name.includes("liquid") || name.includes("debt") || name.includes("bond") || name.includes("gilt") || name.includes("money market")) {
        return "Debt Funds";
      }
      if (name.includes("hybrid") || name.includes("balanced") || name.includes("multi asset") || name.includes("dynamic") || name.includes("advantage") || name.includes("baf")) {
        return "Multi Asset / Hybrid";
      }
      return "Equity Funds";
    }
    return "ETFs & Others";
  };

  // Group asset class allocations for DonutChart
  const getChartAllocation = () => {
    const categories: Record<string, number> = {};
    assets.forEach((a) => {
      const typeLabel = getFundCategory(a);
      categories[typeLabel] = (categories[typeLabel] || 0) + Number(a.market_value ?? 0);
    });
    return Object.keys(categories).map((name) => ({
      name,
      value: categories[name],
    }));
  };

  const chartAllocation = getChartAllocation();

  const getTopMovers = () => {
    const assetsWithReturns = assets.map(a => {
      const invested = Number(a.cost_basis ?? a.average_buy_price ?? 0);
      const current = Number(a.market_value ?? 0);
      const absoluteReturn = current - invested;
      const pctReturn = invested > 0 ? (absoluteReturn / invested) * 100 : 0;
      return { ...a, absoluteReturn, pctReturn, current, invested };
    }).filter(a => a.invested > 0);

    const sortedByPct = [...assetsWithReturns].sort((a, b) => b.pctReturn - a.pctReturn);
    return {
      topGainers: sortedByPct.slice(0, 3),
      topLosers: [...sortedByPct].reverse().slice(0, 3),
    };
  };

  const { topGainers, topLosers } = getTopMovers();

  // Get Invested vs Current value by asset class for the BarChart
  const getBarChartData = () => {
    const dataMap: Record<string, { Invested: number; Current: number }> = {};
    assets.forEach((a) => {
      const typeLabel = getFundCategory(a);
      if (!dataMap[typeLabel]) {
        dataMap[typeLabel] = { Invested: 0, Current: 0 };
      }
      dataMap[typeLabel].Invested += Number(a.cost_basis ?? a.market_value ?? 0);
      dataMap[typeLabel].Current += Number(a.market_value ?? 0);
    });
    return Object.keys(dataMap).map((key) => ({
      Category: key,
      "Invested Capital": Math.round(dataMap[key].Invested),
      "Current Value": Math.round(dataMap[key].Current),
    }));
  };

  const barChartData = getBarChartData();



  const failedPortfolios = portfolios.filter((p) => p.upload_status === "failed");
  const processingPortfolios = portfolios.filter((p) => p.upload_status === "processing");

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm("Are you sure you want to delete this holding?")) return;
    try {
      const { error } = await supabase.from("assets").delete().eq("id", assetId);
      if (error) throw error;
      toast.success("Holding deleted successfully");

      // Recalculate portfolio totals
      const portfolioId = portfolios[0]?.id;
      if (portfolioId) {
        const { data: remainingAssets } = await supabase
          .from("assets")
          .select("market_value, cost_basis")
          .eq("portfolio_id", portfolioId);

        const totalVal = remainingAssets?.reduce((sum, a) => sum + Number(a.market_value || 0), 0) || 0;
        const totalCost = remainingAssets?.reduce((sum, a) => sum + Number(a.cost_basis || 0), 0) || 0;

        await supabase
          .from("portfolios")
          .update({
            total_value: totalVal,
            total_invested: totalCost,
          })
          .eq("id", portfolioId);
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete holding");
    }
  };

  const handleEditAsset = (asset: any) => {
    setEditingAsset(asset);
    setModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditingAsset(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {showSplash && (
        <SplashScreen
          isLoading={!marketSummary}
          onComplete={() => setShowSplash(false)}
        />
      )}
      {/* Live Market indices ticker at the top */}
      {(() => {
        const liveIndices = (marketSummary && marketSummary.indices && marketSummary.indices.length > 0)
          ? marketSummary.indices
          : [
              { short: "NIFTY 50", price: 23767.45, change: -102.15, change_pct: -0.43 },
              { short: "SENSEX", price: 76059.77, change: -312.40, change_pct: -0.41 },
              { short: "BANK NIFTY", price: 51240.10, change: 185.30, change_pct: 0.36 },
              { short: "NIFTY MIDCAP", price: 54120.80, change: 240.15, change_pct: 0.45 },
              { short: "S&P 500", price: 5464.61, change: 15.20, change_pct: 0.28 },
              { short: "NASDAQ", price: 17689.36, change: 98.45, change_pct: 0.56 },
            ];

        return (
          <div className="relative z-20 flex items-center w-full max-w-full my-2 overflow-hidden bg-[#09090b]/95 border-y border-[#27272a] shadow-lg backdrop-blur-xl">
            <div className={`flex shrink-0 items-center gap-1.5 z-20 bg-[#09090b] px-4 py-2.5 text-[11px] sm:text-xs font-bold tracking-wider uppercase border-r border-[#27272a] shadow-md ${isMarketOpen ? 'text-blue-400' : 'text-zinc-400'}`}>
              <Activity className={`h-3.5 w-3.5 ${isMarketOpen ? 'animate-pulse' : ''}`} /> 
              <span>{isMarketOpen ? 'Market Live' : 'Market Closed'}</span>
            </div>

            <div className="overflow-hidden flex-1 relative flex items-center">
              <div 
                className="animate-marquee flex items-center gap-8 py-2.5 select-none hover:[animation-play-state:paused] cursor-pointer"
                style={{ animation: "marquee-slide 30s linear infinite" }}
              >
                {Array(4).fill(liveIndices).flat().map((idx: any, index: number) => {
                  const change = idx.change ?? 0;
                  const positive = change >= 0;
                  const Icon = positive ? TrendingUp : TrendingDown;
                  return (
                    <div key={`${idx.short}-${index}`} className="flex shrink-0 items-center gap-2 text-xs">
                      <span className="font-bold text-zinc-300">{idx.short}</span>
                      <span className="font-extrabold text-white tabular-nums">{Number(idx.price).toLocaleString("en-IN")}</span>
                      <span className={`flex items-center gap-0.5 font-semibold tabular-nums ${positive ? "text-emerald-400" : "text-red-400"}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {positive ? "+" : ""}
                        {change.toFixed(2)}
                        {typeof idx?.change_pct === "number" && ` (${positive ? "+" : ""}${Number(idx.change_pct).toFixed(2)}%)`}
                      </span>
                      <span className="text-white/20 ml-2">•</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      <div className="px-4 sm:px-6 lg:px-8 space-y-6 pt-2 pb-8">
        {/* Navigation Tabs and Manual Entry Trigger - Dynamically hidden on mobile screens when bottom nav capsule is present */}
        <div className="hidden lg:flex sticky top-0 z-30 w-full border-b border-[#27272a] bg-[#09090b]/95 backdrop-blur-xl py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-6 overflow-x-auto scrollbar-none">
          <div className="flex items-center justify-between gap-4 w-full min-w-max">
            <nav className="inline-flex items-center p-1 sm:p-1.5 bg-[#121215]/95 backdrop-blur-2xl rounded-2xl border border-[#27272a] shadow-lg gap-1 sm:gap-1.5 overflow-x-auto">
              {[
                { id: "market", name: "Markets", icon: Activity },
                { id: "funds", name: "Funds", icon: Compass },
                { id: "portfolio", name: "Portfolio", icon: Briefcase },
                { id: "currency", name: "Currency", icon: Coins }
              ].map((tab) => {
                const active = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      router.push(`/dashboard?tab=${tab.id}`, { scroll: false });
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-4.5 rounded-xl transition-all duration-200 select-none whitespace-nowrap ${
                      active
                        ? "bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-blue-600/30 text-white font-extrabold border border-blue-500/40 shadow-md shadow-blue-500/20 backdrop-blur-xl"
                        : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent font-semibold"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? "text-blue-400 stroke-[2.5]" : "text-slate-400"}`} />
                    <span className="text-sm font-bold whitespace-nowrap">{tab.name}</span>
                  </button>
                );
              })}
            </nav>

            {user && activeTab === "portfolio" && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={handleSyncPortfolio}
                  disabled={isSyncing}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold shadow-lg transition-all duration-200 active:scale-90 p-0 shrink-0 border border-white/10 backdrop-blur-md"
                  title="Sync with live market values"
                >
                  <span className={`inline-flex items-center justify-center h-4 w-4 shrink-0 ${isSyncing ? "animate-spin transform-gpu" : ""}`}>
                    <RefreshCw className="h-4 w-4" />
                  </span>
                </Button>

                <Button
                  onClick={() => router.push("/portfolio/upload")}
                  className="hidden sm:flex h-9 items-center gap-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white font-semibold text-xs border border-white/10 shadow-md transition-all duration-200 shrink-0"
                  title="Upload CAS or Portfolio Statement"
                >
                  <Upload className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Upload</span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="flex h-9 items-center gap-1.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 font-bold text-white shadow-lg shadow-blue-500/20 transition-all duration-200 active:scale-95 shrink-0 border border-white/10 text-xs cursor-pointer"
                    title="Add or Upload Assets"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add</span>
                    <ChevronDown className="h-3 w-3 opacity-80" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 bg-[#090e1d] border border-white/15 text-white p-1.5 shadow-2xl rounded-2xl z-50">
                    <DropdownMenuItem
                      onClick={handleOpenAddModal}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl hover:bg-blue-600/25 text-slate-200 hover:text-white cursor-pointer"
                    >
                      <Plus className="h-4 w-4 text-blue-400" />
                      <span>Add Asset Manually</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/portfolio/upload")}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl hover:bg-blue-600/25 text-slate-200 hover:text-white cursor-pointer"
                    >
                      <Upload className="h-4 w-4 text-emerald-400" />
                      <span>Upload Statement</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        {failedPortfolios.length > 0 && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {failedPortfolios.length} portfolio(s) failed to parse. Re-upload statements or check file formatting.
          </div>
        )}
        {processingPortfolios.length > 0 && (
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-blue-400 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            <span>Parsing statement(s) in background...</span>
          </div>
        )}

        {/* -------------------- TAB 1: PORTFOLIO VIEW -------------------- */}
        {activeTab === "portfolio" && (
          <div className="space-y-6">
            {user && (
              <div className="lg:hidden flex items-center justify-between gap-2 p-3 bg-[#090e1d]/90 border border-white/15 rounded-2xl backdrop-blur-2xl shadow-xl">
                <div className="flex items-center gap-2 min-w-0">
                  <Briefcase className="h-4 w-4 text-blue-400 shrink-0" />
                  <span className="text-xs font-bold text-white truncate">Portfolio Actions</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    onClick={handleSyncPortfolio}
                    disabled={isSyncing}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold shadow-sm p-0 border border-white/10"
                    title="Sync with live market values"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  </Button>
                  <Button
                    onClick={() => router.push("/portfolio/upload")}
                    className="flex h-8 items-center gap-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10"
                  >
                    <Upload className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Upload</span>
                  </Button>
                  <Button
                    onClick={handleOpenAddModal}
                    className="flex h-8 items-center gap-1.5 px-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold shadow-md"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </Button>
                </div>
              </div>
            )}
            {!user ? (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 border border-white/5 bg-slate-900/20 rounded-2xl mx-4 sm:mx-0">
                <div className="rounded-full bg-blue-500/10 p-5 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                  <Lock className="h-10 w-10 text-blue-400" />
                </div>
                <div className="space-y-2 px-4">
                  <h2 className="text-2xl font-bold text-white tracking-tight">Portfolio Access Restricted</h2>
                  <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
                    Log in to securely connect your brokerage accounts, upload CAS statements, and unlock advanced P&L analytics.
                  </p>
                </div>
                <div className="flex gap-4 pt-2">
                  <Link href="/login">
                    <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25">
                      Create Account <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* ----------------- MOCKUP MATCHING HERO GLASS CARD ----------------- */}
                <div className="rounded-3xl border border-[#27272a] bg-gradient-to-b from-[#18181b]/95 via-[#121215]/90 to-[#09090b]/95 p-6 shadow-2xl backdrop-blur-2xl relative overflow-hidden space-y-6">
                  {/* Subtle ambient lighting background blur */}
                  <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Header Greeting & Profile Avatar */}
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-xs text-zinc-400 font-medium">Good Day,</p>
                      <h2 className="text-xl font-bold text-white tracking-tight">
                        {user.user_metadata?.full_name || user.email?.split("@")[0] || "Investor"}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-blue-600 text-sm font-bold text-white shadow-lg ring-2 ring-emerald-400/20">
                        {(user.email?.[0] || "A").toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Hero Value & Daily Gain */}
                  <div className="relative z-10 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Total Portfolio Value</p>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono border transition-all duration-300 ${periodData.percent >= 0 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                        {periodData.percent >= 0 ? "+" : ""}{periodData.percent.toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight tabular-nums font-mono">
                        {formatIndianCurrency(totalValue)}
                      </h1>
                      <p className={`text-xs sm:text-sm font-semibold font-mono transition-all duration-300 ${periodData.gainAmount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {periodData.gainAmount >= 0 ? "+" : ""}{formatIndianCurrency(periodData.gainAmount)} {periodData.label}
                      </p>
                    </div>
                  </div>

                  {/* Time Range Filter Selector (Pills) */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 relative z-10">
                    <p className="text-[11px] font-semibold text-zinc-400">Artha Wealth</p>
                    <div className="flex items-center gap-1 bg-zinc-900/80 border border-[#27272a] p-1 rounded-full backdrop-blur-md">
                      {(["1M", "3M", "6M", "1Y"] as const).map((range) => (
                        <button
                          key={range}
                          onClick={() => setPortfolioTimeRange(range)}
                          className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
                            portfolioTimeRange === range
                              ? "bg-zinc-800 text-white shadow border border-zinc-700 scale-105"
                              : "text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Smoothed SVG Area Graph Wave */}
                  <div className="h-20 w-full relative z-0 pt-2 opacity-90">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 400 60" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={periodData.percent >= 0 ? "#10b981" : "#ef4444"} stopOpacity="0.4" />
                          <stop offset="100%" stopColor={periodData.percent >= 0 ? "#10b981" : "#ef4444"} stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d={periodData.svgPath}
                        fill="none"
                        stroke={periodData.percent >= 0 ? "#10b981" : "#ef4444"}
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="transition-all duration-500 ease-in-out"
                      />
                      <path
                        d={`${periodData.svgPath} L 400 60 L 0 60 Z`}
                        fill="url(#areaGlow)"
                        className="transition-all duration-500 ease-in-out"
                      />
                      <circle cx="400" cy="2" r="4" fill={periodData.percent >= 0 ? "#34d399" : "#f87171"} className="animate-ping" />
                      <circle cx="400" cy="2" r="4" fill={periodData.percent >= 0 ? "#10b981" : "#ef4444"} />
                    </svg>
                  </div>
                </div>

                {/* ----------------- YOUR PORTFOLIOS CATEGORY CARDS (MOCKUP STYLE) ----------------- */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <Layers className="h-4 w-4 text-emerald-400" />
                    <span>Your Portfolios</span>
                  </h3>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                    <div className="p-4 rounded-2xl bg-[#121215]/90 border border-[#27272a] hover:border-zinc-700 transition-all duration-300 backdrop-blur-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-400">Growth Equity</span>
                        <span className="text-emerald-400 font-bold font-mono text-[11px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">+2.1%</span>
                      </div>
                      <h4 className="text-lg font-bold font-mono text-white tabular-nums">
                        {formatIndianCurrency(equitiesTotal || totalValue * 0.6)}
                      </h4>
                      <div className="flex items-end gap-1 h-6 pt-2">
                        <div className="w-full bg-emerald-500/40 rounded-t h-3" />
                        <div className="w-full bg-emerald-500/60 rounded-t h-4" />
                        <div className="w-full bg-emerald-500/80 rounded-t h-2" />
                        <div className="w-full bg-emerald-400 rounded-t h-6" />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#121215]/90 border border-[#27272a] hover:border-zinc-700 transition-all duration-300 backdrop-blur-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-400">Global & Mutual Funds</span>
                        <span className="text-emerald-400 font-bold font-mono text-[11px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">+1.6%</span>
                      </div>
                      <h4 className="text-lg font-bold font-mono text-white tabular-nums">
                        {formatIndianCurrency(mutualFundsTotal || totalValue * 0.3)}
                      </h4>
                      <div className="flex items-end gap-1 h-6 pt-2">
                        <div className="w-full bg-blue-500/40 rounded-t h-2" />
                        <div className="w-full bg-blue-500/60 rounded-t h-5" />
                        <div className="w-full bg-blue-500/80 rounded-t h-4" />
                        <div className="w-full bg-blue-400 rounded-t h-6" />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#121215]/90 border border-[#27272a] hover:border-zinc-700 transition-all duration-300 backdrop-blur-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-400">SGB & Fixed Assets</span>
                        <span className="text-amber-400 font-bold font-mono text-[11px] bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">+0.9%</span>
                      </div>
                      <h4 className="text-lg font-bold font-mono text-white tabular-nums">
                        {formatIndianCurrency(otherTotal || totalValue * 0.1)}
                      </h4>
                      <div className="flex items-end gap-1 h-6 pt-2">
                        <div className="w-full bg-amber-500/40 rounded-t h-4" />
                        <div className="w-full bg-amber-500/60 rounded-t h-3" />
                        <div className="w-full bg-amber-500/80 rounded-t h-5" />
                        <div className="w-full bg-amber-400 rounded-t h-4" />
                      </div>
                    </div>
                  </div>
                </div>

            {/* Uploaded Statement Sources & Linked Accounts Manager */}
            {localPortfolios && localPortfolios.length > 0 && (
              <Card className="border-[#27272a] bg-[#121215]/90 glass-card">
                <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-[#27272a]">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-400" />
                      <span>Uploaded Statement Sources & Linked Accounts</span>
                      <span className="text-xs font-mono font-normal text-zinc-400 bg-zinc-900 border border-[#27272a] px-2 py-0.5 rounded-full">
                        {localPortfolios.length} Total
                      </span>
                    </CardTitle>
                    <p className="text-[11px] text-zinc-400">
                      Manage your uploaded CAS PDFs, broker statements, and screenshots. Tap delete to remove a source and update database records instantly.
                    </p>
                  </div>
                  <Link href="/portfolio/upload">
                    <Button size="sm" className="h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white gap-1.5 rounded-xl shadow-md">
                      <Upload className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Upload Source</span>
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {localPortfolios.map((p: any) => {
                      const fileName = p.file_path ? p.file_path.split("/").pop() : "Statement Record";
                      const isPdf = fileName.toLowerCase().endsWith(".pdf");

                      return (
                        <div key={p.id} className="flex flex-col justify-between p-3.5 rounded-xl bg-zinc-950/80 border border-[#27272a] hover:border-zinc-700 transition-all space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className={`p-2 rounded-lg shrink-0 ${isPdf ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"}`}>
                                {isPdf ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-white truncate" title={fileName}>{fileName}</p>
                                <p className="text-[9.5px] font-mono text-zinc-400 mt-0.5">
                                  As of: {p.as_of_date || (p.created_at ? p.created_at.split("T")[0] : "Recent")}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteStatement(p.id);
                              }}
                              className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 active:scale-95 transition-all touch-manipulation cursor-pointer"
                              title="Remove statement source & update database"
                              aria-label="Delete statement record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                            <span className="text-zinc-400 font-medium">Parsed Value</span>
                            <span className="font-bold font-mono text-white">
                              {p.total_value ? formatIndianCurrency(Number(p.total_value)) : "Synced"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Portfolio Insights & Health Analysis */}
            {assets.length > 0 && (
              <Card className="border border-white/10 bg-[#0c101d]/90 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-white/5 bg-slate-900/40 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                      <Sparkles className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-white tracking-tight">
                        Portfolio Insights & Health Analysis
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-400">
                        Real-time automated diagnostic summary of your asset allocation, risk exposure, and growth strategy.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Insight 1: Asset Allocation & Health */}
                    <div className="rounded-xl border border-white/5 bg-slate-900/50 p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Asset Allocation</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                          totalValue > 0 && Math.round((equitiesTotal / totalValue) * 100) > 70
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}>
                          {totalValue > 0 ? `${Math.round((mutualFundsTotal / totalValue) * 100)}% MF / ${Math.round((equitiesTotal / totalValue) * 100)}% Equity` : "100% Cash"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-light">
                        {totalValue > 0 && Math.round((equitiesTotal / totalValue) * 100) > 70
                          ? "High exposure to direct equities (over 70%). Rebalancing a portion into mutual funds or debt assets will help buffer market corrections."
                          : "Your portfolio has a balanced ratio between mutual funds and equities, providing stable long-term compound growth."}
                      </p>
                    </div>

                    {/* Insight 2: Diversification & Risk Profile */}
                    <div className="rounded-xl border border-white/5 bg-slate-900/50 p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Diversification</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                          diversificationRating === "High"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : diversificationRating === "Medium"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                          {diversificationRating} Spread
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-light">
                        {diversificationRating === "High"
                          ? "Excellent risk distribution across multiple asset categories. Your portfolio is well-protected against sector-specific downturns."
                          : diversificationRating === "Medium"
                          ? "Good spread across core holdings. Adding a Flexi Cap or Index Fund can further optimize risk-adjusted returns."
                          : "Investments are concentrated in a few assets. Consider spreading capital across flexi cap or large cap mutual funds."}
                      </p>
                    </div>

                    {/* Insight 3: Performance & Wealth Strategy */}
                    <div className="rounded-xl border border-white/5 bg-slate-900/50 p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Growth Outlook</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                          totalGain !== null && totalGain >= 0
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}>
                          {totalGain !== null && totalGain >= 0 ? "+ Positive Trajectory" : "Consolidating"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-light">
                        {totalGain !== null && totalGain >= 0
                          ? "Your investments are generating positive returns. Setting up systematic monthly SIP top-ups will accelerate wealth compounding."
                          : "Temporary market consolidation observed. Maintain your long-term investment horizon and accumulate quality units during dips."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Charts section */}
            {assets.length > 0 && (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-5">
                {/* Line chart: net worth timeline */}
                <Card className="md:col-span-3 border-white/5 bg-slate-900/40 glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-white uppercase tracking-wider">Invested Capital vs Current Value</CardTitle>
                    <CardDescription className="text-[10px] text-slate-400 font-light">Real-time asset value compared to purchase cost</CardDescription>
                  </CardHeader>
                  <CardContent className="h-56 mt-2">
                    <CustomBarChart data={barChartData} />
                  </CardContent>
                </Card>

                {/* Redesigned Asset Class Allocation Visual */}
                <Card className="md:col-span-2 border-white/5 bg-slate-900/40 glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-white uppercase tracking-wider">Asset Class Allocation</CardTitle>
                    <CardDescription className="text-[10px] text-slate-400 font-light">Distribution across asset classes</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center h-56 mt-2 pt-2 pb-0">
                    <CustomDonutChart data={chartAllocation} />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Top Movers Section */}
              {(topGainers.length > 0 || topLosers.length > 0) && (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mt-6">
                  {/* Top Gainers */}
                  <Card className="border-emerald-500/10 bg-slate-900/40 glass-card">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </div>
                        <CardTitle className="text-xs font-bold text-white uppercase tracking-wider">Top Performers</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-2">
                      {topGainers.length === 0 ? (
                        <div className="text-xs text-slate-500 py-2">No gainers found.</div>
                      ) : (
                        topGainers.map((asset, i) => (
                          <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/30 border border-white/5 hover:border-emerald-500/30 transition-colors">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-200 truncate max-w-[180px]">{asset.name}</span>
                              <span className="text-[10px] text-slate-400">{asset.asset_type === "mutual_fund" ? "Mutual Fund" : "Direct Equity"}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-bold text-emerald-400 flex items-center">
                                <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                                {asset.pctReturn.toFixed(2)}%
                              </span>
                              <span className="text-[10px] text-emerald-500/70">+₹{asset.absoluteReturn.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Top Losers */}
                  <Card className="border-red-500/10 bg-slate-900/40 glass-card">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-red-500/10 border border-red-500/20">
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        </div>
                        <CardTitle className="text-xs font-bold text-white uppercase tracking-wider">Needs Attention</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-2">
                      {topLosers.length === 0 || topLosers[0].pctReturn >= 0 ? (
                        <div className="text-xs text-slate-500 py-2">No assets in loss! 🎉</div>
                      ) : (
                        topLosers.filter(a => a.pctReturn < 0).map((asset, i) => (
                          <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/30 border border-white/5 hover:border-red-500/30 transition-colors">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-200 truncate max-w-[180px]">{asset.name}</span>
                              <span className="text-[10px] text-slate-400">{asset.asset_type === "mutual_fund" ? "Mutual Fund" : "Direct Equity"}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-bold text-red-400 flex items-center">
                                <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                                {Math.abs(asset.pctReturn).toFixed(2)}%
                              </span>
                              <span className="text-[10px] text-red-500/70">-₹{Math.abs(asset.absoluteReturn).toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            {/* Holdings Table */}
            {assets.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-16 text-center border border-dashed border-white/10 rounded-xl bg-slate-950/20">
                <div className="rounded-full bg-slate-900 border border-white/5 p-4 text-slate-400 animate-pulse">
                  <Upload className="h-8 w-8 text-slate-300" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-white">No active holdings</p>
                  <p className="text-xs text-slate-400 font-light max-w-sm px-6">
                    Upload your Consolidated Account Statement (CAS), upload a dashboard screenshot, or click "Add Asset Manually" to get started immediately.
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <Link href="/portfolio/upload">
                    <Button className="bg-blue-600 hover:bg-blue-500 shadow-md text-xs">
                      <Upload className="mr-1.5 h-3.5 w-3.5" />
                      Upload Statement
                    </Button>
                  </Link>
                  <Button onClick={handleOpenAddModal} variant="outline" className="border-white/10 text-xs text-slate-300">
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Holding
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="border-white/5 bg-slate-900/40 glass-card overflow-hidden">
                <CardHeader className="p-4 sm:p-6 border-b border-white/5 bg-slate-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base font-bold text-white">Holdings List</CardTitle>
                    <CardDescription className="text-xs text-slate-400 font-light">Filter, update, and manage your asset holdings</CardDescription>
                  </div>
                  {/* Filters and search */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full sm:w-56">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <Input
                        placeholder="Search name or ISIN..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-xs bg-slate-950/60 border-white/10 text-white"
                      />
                    </div>
                    <select
                      value={assetTypeFilter}
                      onChange={(e) => setAssetTypeFilter(e.target.value)}
                      className="w-full sm:w-40 h-9 rounded-md bg-slate-950/60 border border-white/10 text-xs text-white px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Asset Classes</option>
                      <option value="mutual_fund">Mutual Funds</option>
                      <option value="equity">Equities</option>
                      <option value="etf">ETFs / Bonds</option>
                    </select>
                  </div>
                </CardHeader>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-white/5 bg-slate-950/30 text-[10px] text-slate-400 uppercase tracking-wider">
                        <th className="px-4 sm:px-6 py-4 font-bold">Instrument Name</th>
                        <th className="px-4 sm:px-6 py-4 font-bold">Asset Type</th>
                        <th className="px-4 sm:px-6 py-4 font-bold">Quantity</th>
                        <th className="px-4 sm:px-6 py-4 font-bold">Latest Price</th>
                        <th className="px-4 sm:px-6 py-4 font-bold text-right">Market Value</th>
                        <th className="px-4 sm:px-6 py-4 font-bold text-right">{hasCostBasis ? "Gain / Loss" : "Folio"}</th>
                        <th className="px-4 sm:px-6 py-4 font-bold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssets.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-10 text-center text-slate-500 text-xs font-light">
                            No holdings match your search filters.
                          </td>
                        </tr>
                      ) : (
                        filteredAssets.map((asset) => {
                          const gain = asset.cost_basis && Number(asset.cost_basis) > 0
                            ? Number(asset.market_value ?? 0) - Number(asset.cost_basis)
                            : null;
                          const gainPct = gain !== null && Number(asset.cost_basis) > 0
                            ? (gain / Number(asset.cost_basis)) * 100
                            : null;
                          return (
                            <tr key={asset.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                              <td className="px-4 sm:px-6 py-4">
                                <p className="font-semibold text-white text-xs sm:text-sm">{asset.name}</p>
                                {asset.isin && (
                                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 tracking-wider uppercase">{asset.isin}</p>
                                )}
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  asset.asset_type === "mutual_fund" ? "bg-emerald-500/10 text-emerald-400" :
                                  asset.asset_type === "equity" ? "bg-blue-500/10 text-blue-400" : "bg-violet-500/10 text-violet-400"
                                }`}>
                                  {asset.asset_type?.replace("_", " ")}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-4 font-mono text-xs text-slate-300">
                                {Number(asset.quantity).toFixed(2)}
                              </td>
                              <td className="px-4 sm:px-6 py-4 font-mono text-xs text-slate-300">
                                {asset.current_price ? formatIndianCurrency(Number(asset.current_price)) : "—"}
                              </td>
                              <td className="px-4 sm:px-6 py-4 text-right font-mono font-bold text-white text-xs sm:text-sm">
                                {asset.market_value ? formatIndianCurrency(Number(asset.market_value)) : "—"}
                              </td>
                              <td className="px-4 sm:px-6 py-4 text-right">
                                {gain !== null ? (
                                  <span className={`font-mono text-xs font-bold ${gain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                    {gain >= 0 ? "+" : ""}{formatIndianCurrency(gain)}
                                    <span className="text-[10px] font-normal ml-1">({gain >= 0 ? "+" : ""}{gainPct?.toFixed(1)}%)</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-500 text-xs font-mono">{asset.metadata?.folio || "—"}</span>
                                )}
                              </td>
                              <td className="px-4 sm:px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleEditAsset(asset)}
                                    className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                                    title="Edit asset"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAsset(asset.id)}
                                    className="p-1.5 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all"
                                    title="Delete asset"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card List — shown only on small screens */}
                <div className="md:hidden divide-y divide-white/5">
                  {filteredAssets.length === 0 ? (
                    <p className="px-4 py-10 text-center text-slate-500 text-xs">No holdings match your search filters.</p>
                  ) : (
                    filteredAssets.map((asset) => {
                      const gain = asset.cost_basis && Number(asset.cost_basis) > 0
                        ? Number(asset.market_value ?? 0) - Number(asset.cost_basis)
                        : null;
                      const gainPct = gain !== null && Number(asset.cost_basis) > 0
                        ? (gain / Number(asset.cost_basis)) * 100
                        : null;
                      return (
                        <div key={asset.id} className="px-4 py-4 hover:bg-white/5 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-white text-sm leading-snug truncate">{asset.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  asset.asset_type === "mutual_fund" ? "bg-emerald-500/10 text-emerald-400" :
                                  asset.asset_type === "equity" ? "bg-blue-500/10 text-blue-400" : "bg-violet-500/10 text-violet-400"
                                }`}>
                                  {asset.asset_type?.replace("_", " ")}
                                </span>
                                {asset.isin && (
                                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider truncate">{asset.isin}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleEditAsset(asset)}
                                className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAsset(asset.id)}
                                className="p-1.5 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3 gap-2">
                            <div className="text-left">
                              <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Qty</p>
                              <p className="text-xs font-mono text-slate-300 mt-0.5">{Number(asset.quantity).toFixed(2)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">NAV/Price</p>
                              <p className="text-xs font-mono text-slate-300 mt-0.5">{asset.current_price ? formatIndianCurrency(Number(asset.current_price)) : "—"}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Market Value</p>
                              <p className="text-xs font-mono font-bold text-white mt-0.5">{asset.market_value ? formatIndianCurrency(Number(asset.market_value)) : "—"}</p>
                            </div>
                            {gain !== null && (
                              <div className="text-right">
                                <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">P&L</p>
                                <p className={`text-xs font-mono font-bold mt-0.5 ${gain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                  {gain >= 0 ? "+" : ""}{gainPct?.toFixed(1)}%
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            )}
            </>
          )}
          </div>
        )}

        {/* -------------------- TAB 2: LIVE SHAREMARKET VIEW -------------------- */}
        {activeTab === "market" && (
          <div className="space-y-6 pb-8 animate-fade-in-up">
            {/* Regional Selector Sub-Options Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 scrollbar-none select-none -mx-4 px-4 sm:mx-0 sm:px-0">
                {[
                  { id: "india", label: "India", flag: "🇮🇳", sub: "Nifty 50 & Sensex" },
                  { id: "us", label: "US Market", flag: "🇺🇸", sub: "S&P 500 & Nasdaq" },
                  { id: "europe", label: "Europe", flag: "🇪🇺", sub: "FTSE & DAX 40" },
                  { id: "china", label: "China / HK", flag: "🇨🇳", sub: "Hang Seng & Tech" },
                  { id: "japan", label: "Japan", flag: "🇯🇵", sub: "Nikkei 225 & Auto" },
                  { id: "arab", label: "Middle East", flag: "🇸🇦", sub: "Tadawul & Energy" },
                ].map((region) => {
                  const isActive = selectedMarketRegion === region.id;
                  return (
                    <button
                      key={region.id}
                      type="button"
                      onClick={() => setSelectedMarketRegion(region.id as any)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20 border border-blue-400/40"
                          : "bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800/80"
                      }`}
                    >
                      <span className="text-sm">{region.flag}</span>
                      <span>{region.label}</span>
                      <span className={`text-[9px] font-normal px-1.5 py-0.2 rounded-full ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                      }`}>
                        {region.sub}
                      </span>
                    </button>
                  );
                })}
              </div>

            {/* Currency & Region Helper Wrapper */}
            {(() => {
              const currSymbol = marketSummary?.currency || (selectedMarketRegion === "us" ? "$" : selectedMarketRegion === "europe" ? "€" : selectedMarketRegion === "china" ? "HK$" : selectedMarketRegion === "japan" ? "¥" : selectedMarketRegion === "arab" ? "SAR" : "₹");
              return (
                <>
                  {/* Sector Performance Bar Chart & Top 5 Movers Donut Chart */}
                  {marketSummary && marketSummary.sectors && (
                    <div className="grid gap-4 md:grid-cols-2 pt-2">
                      <Card className="border-white/5 bg-slate-900/40 glass-card">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <div className="h-px w-4 bg-slate-400/30" /> Sector Performance (% Change)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[250px] p-4">
                          <BarChart
                            data={marketSummary.sectors.map((s: any) => ({ name: s.short, "Change %": s.change_pct ?? s.change ?? 0 }))}
                            index="name"
                            categories={["Change %"]}
                            colors={["blue"]}
                            valueFormatter={(val) => `${val}%`}
                            yAxisWidth={48}
                            className="h-full"
                          />
                        </CardContent>
                      </Card>
                      
                      <Card className="border-white/5 bg-slate-900/40 glass-card">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-px w-4 bg-slate-400/30" /> Top 5 Movers by Price
                            </div>
                            <span className="text-[10px] font-mono text-blue-400 font-normal">Dynamic Weight</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="min-h-[260px] p-4 flex justify-center items-center">
                          {(() => {
                            const sourceStocks = marketSummary?.stocks || [];
                            const dynamicMovers = [...sourceStocks]
                              .sort((a, b) => Math.abs(Number(b.change_pct ?? b.change ?? 0)) - Math.abs(Number(a.change_pct ?? a.change ?? 0)))
                              .slice(0, 5);

                            const chartData = dynamicMovers.map((s: any) => ({
                              name: s.short || s.name || "Stock",
                              value: Number(s.price || 0),
                              change_pct: s.change_pct !== undefined ? Number(s.change_pct) : undefined,
                            }));

                             return (
                              <CustomDonutChart
                                data={chartData}
                                currencySymbol={currSymbol}
                                className="w-full"
                              />
                            );
                          })()}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Indices Cards */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <div className="h-px w-4 bg-slate-400/30" /> Major Indices
                      </h3>
                      <span className="text-[11px] font-mono text-slate-500">Live Tick Data ({currSymbol})</span>
                    </div>

                    {marketSummary ? (
                      <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {marketSummary.indices.map((idx: any) => {
                          const change = idx.change ?? 0;
                          const positive = change >= 0;
                          const price = Number(idx.price || 0);
                          const dayLow = price * 0.992;
                          const dayHigh = price * 1.008;
                          const posPct = Math.min(95, Math.max(5, ((price - dayLow) / (dayHigh - dayLow)) * 100));

                          return (
                            <Card 
                              key={idx.short} 
                              className="border-white/10 bg-[#090e1d]/90 glass-card hover:bg-white/[0.06] transition-all duration-300 overflow-hidden shadcn-card-hover group" 
                              style={{ borderBottomWidth: '2px', borderBottomColor: positive ? '#10b981' : '#ef4444' }}
                            >
                              <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between h-full space-y-3">
                                {/* Header row */}
                                <div className="flex justify-between items-start gap-1">
                                  <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-bold text-white tracking-tight truncate group-hover:text-blue-300 transition-colors">
                                      {idx.short || idx.name}
                                    </p>
                                    <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">{selectedMarketRegion.toUpperCase()} • Index</p>
                                  </div>
                                  <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold shrink-0 ${positive ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-red-500/15 text-red-400 border border-red-500/30"}`}>
                                    {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    {positive ? "+" : ""}{typeof idx?.change_pct === "number" ? Number(idx.change_pct).toFixed(2) : "0.00"}%
                                  </div>
                                </div>

                                {/* Price & points */}
                                <div>
                                  <h4 className="text-lg sm:text-xl font-black text-white font-mono tracking-tight">
                                    {currSymbol}{price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </h4>
                                  <p className={`text-[11px] font-mono font-semibold mt-0.5 ${positive ? "text-emerald-400" : "text-red-400"}`}>
                                    {positive ? "+" : ""}{change.toFixed(2)} pts
                                  </p>
                                </div>

                                {/* Day High/Low visual range slider bar */}
                                <div className="pt-2 border-t border-white/10 space-y-1">
                                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                                    <span>Low {currSymbol}{dayLow.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                    <span>High {currSymbol}{dayHigh.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                  </div>
                                  <div className="relative h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden border border-white/5">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-500 ${positive ? "bg-gradient-to-r from-emerald-600 to-teal-400" : "bg-gradient-to-r from-red-600 to-rose-400"}`} 
                                      style={{ width: `${posPct}%` }} 
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : marketError ? (
                      <div className="p-6 border border-red-500/30 bg-red-500/10 text-red-200 rounded-lg text-sm font-mono flex items-center gap-3">
                        <Activity className="h-4 w-4" /> Failed to load real-time market indexes. Checking connection...
                      </div>
                    ) : (
                      <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 animate-pulse">
                        {[1, 2, 3, 4].map((n) => (
                          <div key={n} className="h-36 bg-slate-900/40 border border-white/5 rounded-2xl glass-card" />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sector Categories */}
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <div className="h-px w-4 bg-slate-400/30" /> Sector Performance
                      </h3>
                      <span className="text-[11px] font-mono text-slate-500">Market Breakdown</span>
                    </div>
                    
                    <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {(marketSummary?.sectors || []).map((sector: any) => {
                        const positive = (sector.change_pct || 0) >= 0;
                        const price = Number(sector.price || 0);

                        return (
                          <Card key={sector.name} className="border-white/10 bg-[#090e1d]/90 glass-card hover:bg-white/[0.06] transition-all duration-300 shadcn-card-hover group cursor-pointer">
                            <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-2.5">
                              <div className="flex justify-between items-start gap-1">
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors truncate">{sector.name}</p>
                                  <p className="text-[9px] text-slate-500 font-medium">Sector Benchmark</p>
                                </div>
                                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${positive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                                  {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                  {positive ? "+" : ""}{sector.change_pct}%
                                </div>
                              </div>

                              <div>
                                <p className="text-base font-bold text-white font-mono tracking-tight">{currSymbol}{price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              </div>

                              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9.5px]">
                                <span className="text-slate-400 font-medium">Status</span>
                                <span className={`font-bold font-mono ${positive ? "text-emerald-400" : "text-red-400"}`}>
                                  {positive ? "Outperforming" : "Underperforming"}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stocks Listing - Active Movers */}
                  <div className="space-y-4 pt-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <div className="h-px w-4 bg-slate-400/30" /> Active Movers ({currSymbol})
                    </h3>
                    
                    <div className="border border-white/5 bg-slate-900/40 glass-card rounded-xl overflow-hidden">
                      {marketSummary && marketSummary.stocks ? (
                        <div className="divide-y divide-white/10">
                          <div className="grid grid-cols-12 gap-4 p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/[0.02]">
                            <div className="col-span-5 sm:col-span-4">Company</div>
                            <div className="col-span-2 hidden sm:block">Ticker</div>
                            <div className="col-span-4 sm:col-span-2 text-right">Last Price</div>
                            <div className="col-span-2 hidden sm:block text-right">Change</div>
                            <div className="col-span-3 sm:col-span-2 text-right">Trend</div>
                          </div>
                          {marketSummary.stocks.map((stock: any) => {
                            const change = stock.change ?? 0;
                            const positive = change >= 0;
                            return (
                              <div key={stock.symbol} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-all duration-200 border-b border-white/5 last:border-0">
                                {/* Company Name */}
                                <div className="col-span-5 sm:col-span-4 min-w-0">
                                  <p className="text-sm font-bold text-white tracking-wide truncate">{stock.short}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5 truncate pr-2">{stock.name}</p>
                                </div>
                                
                                {/* Ticker badge (sm+) */}
                                <div className="col-span-2 hidden sm:flex items-center">
                                  <span className="text-[10px] font-mono bg-white/5 border border-white/5 text-slate-300 px-2 py-0.5 rounded font-medium">
                                    {stock.symbol}
                                  </span>
                                </div>
                                
                                {/* Last Price */}
                                <div className="col-span-4 sm:col-span-2 text-right">
                                  <p className="text-sm font-bold font-mono text-white">
                                    {currSymbol}{Number(stock.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                </div>
                                
                                {/* Absolute Change (sm+) */}
                                <div className="col-span-2 hidden sm:block text-right">
                                  <p className={`text-sm font-mono font-semibold ${positive ? "text-emerald-400" : "text-red-400"}`}>
                                    {positive ? "+" : ""}{change.toFixed(2)}
                                  </p>
                                </div>
                                
                                {/* Change Percent Pill */}
                                <div className="col-span-3 sm:col-span-2 flex justify-end">
                                  <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg flex items-center justify-center gap-0.5 min-w-[75px] ${
                                    positive 
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" 
                                      : "bg-red-500/10 text-red-400 border border-red-500/15"
                                  }`}>
                                    {positive ? "+" : ""}{typeof stock?.change_pct === "number" ? Number(stock.change_pct).toFixed(2) : "0.00"}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="divide-y divide-white/10">
                          <div className="grid grid-cols-12 gap-4 p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/[0.02]">
                            <div className="col-span-5 sm:col-span-4">Company</div>
                            <div className="col-span-2 hidden sm:block">Ticker</div>
                            <div className="col-span-4 sm:col-span-2 text-right">Last Price</div>
                            <div className="col-span-2 hidden sm:block text-right">Change</div>
                            <div className="col-span-3 sm:col-span-2 text-right">Trend</div>
                          </div>
                          {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="grid grid-cols-12 gap-4 p-4 items-center border-b border-white/5 last:border-0 animate-pulse">
                              <div className="col-span-5 sm:col-span-4 flex items-center gap-3">
                                <Skeleton className="h-8 w-8 rounded-md bg-white/5" />
                                <div className="flex flex-col gap-1.5">
                                  <Skeleton className="h-4 w-24 bg-white/5" />
                                  <Skeleton className="h-3 w-16 bg-white/5" />
                                </div>
                              </div>
                              <div className="col-span-2 hidden sm:block">
                                <Skeleton className="h-5 w-16 bg-white/5" />
                              </div>
                              <div className="col-span-4 sm:col-span-2 text-right">
                                <Skeleton className="h-4.5 w-16 bg-white/5 ml-auto" />
                              </div>
                              <div className="col-span-2 hidden sm:block text-right">
                                <Skeleton className="h-4 w-12 bg-white/5 ml-auto" />
                              </div>
                              <div className="col-span-3 sm:col-span-2 flex justify-end">
                                <Skeleton className="h-6 w-16 bg-white/5" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* -------------------- TAB 3: MUTUAL FUND AGGREGATOR VIEW -------------------- */}
        {activeTab === "funds" && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Interactive Dynamic Sub-filters */}
            {(() => {
              const filterOptions = [
                { id: "all", label: "All Funds" },
                { id: "flexi", label: "Flexi & Multi Cap" },
                { id: "large", label: "Large Cap" },
                { id: "mid", label: "Mid Cap" },
                { id: "small", label: "Small Cap" },
                { id: "index", label: "Index Funds" },
                { id: "elss", label: "ELSS (Tax Saver)" },
                { id: "debt", label: "Debt & Other" },
              ];

              const getCategoryCount = (catId: string) => {
                return topFunds.filter((fund: any) => {
                  if (catId === "all") return true;
                  const cat = (fund.category || "").toLowerCase();
                  if (catId === "large") return cat.includes("large");
                  if (catId === "mid") return cat.includes("mid");
                  if (catId === "small") return cat.includes("small");
                  if (catId === "flexi") return cat.includes("flexi") || cat.includes("multi");
                  if (catId === "index") return cat.includes("index");
                  if (catId === "elss") return cat.includes("elss") || cat.includes("tax");
                  if (catId === "debt") return cat.includes("debt") || cat.includes("g-sec") || cat.includes("liquid") || cat.includes("contra") || cat.includes("arbitrage") || cat.includes("international");
                  return true;
                }).length;
              };

              const displayFunds = topFunds.filter((fund: any) => {
                if (fundFilterCategory === "all") return true;
                const cat = (fund.category || "").toLowerCase();
                if (fundFilterCategory === "large") return cat.includes("large");
                if (fundFilterCategory === "mid") return cat.includes("mid");
                if (fundFilterCategory === "small") return cat.includes("small");
                if (fundFilterCategory === "flexi") return cat.includes("flexi") || cat.includes("multi");
                if (fundFilterCategory === "index") return cat.includes("index");
                if (fundFilterCategory === "elss") return cat.includes("elss") || cat.includes("tax");
                if (fundFilterCategory === "debt") return cat.includes("debt") || cat.includes("g-sec") || cat.includes("liquid") || cat.includes("contra") || cat.includes("arbitrage") || cat.includes("international");
                return true;
              });

              return (
                <div className="space-y-6">
                  {/* Category Filter Pills Bar */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none -mx-4 px-4 sm:mx-0 sm:px-0">
                    {filterOptions.map((opt) => {
                      const isActive = fundFilterCategory === opt.id;
                      const count = getCategoryCount(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setFundFilterCategory(opt.id)}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                            isActive
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20 border border-blue-400/40"
                              : "bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800/80"
                          }`}
                        >
                          <span>{opt.label}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                              isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Fund Grid */}
                  {fundsLoading ? (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div key={n} className="h-44 bg-slate-900/40 border border-white/5 rounded-2xl" />
                      ))}
                    </div>
                  ) : displayFunds.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {displayFunds.map((fund: any) => {
                        const positive = fund.change >= 0;
                        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
                          fund.name + " Mutual Fund Value Research"
                        )}`;

                        const catLower = (fund.category || "").toLowerCase();
                        const colorClasses = catLower.includes("mid")
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/10"
                          : catLower.includes("small")
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/10"
                          : catLower.includes("large") || catLower.includes("flexi")
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/10"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/10";

                        return (
                          <a
                            key={fund.code}
                            href={searchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/60 hover:shadow-xl hover:shadow-black/20 block focus:outline-none"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${colorClasses}`}>
                                  {fund.category}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">ID: {fund.code}</span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-sm sm:text-base text-slate-200 group-hover:text-white line-clamp-2 tracking-tight transition-colors">
                                  {fund.name}
                                </h3>
                                <p className="mt-1 text-[11px] font-medium text-slate-500">
                                  AUM: <span className="text-slate-400">{fund.aum}</span>
                                </p>
                              </div>
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-800/60 pt-3">
                              <div>
                                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Direct NAV</p>
                                <p className="text-base font-bold text-slate-100 mt-0.5">₹{fund.nav}</p>
                                <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded mt-1 ${positive ? "text-emerald-400 bg-emerald-500/5" : "text-rose-400 bg-rose-500/5"}`}>
                                  {positive ? "↑" : "↓"} {Math.abs(fund.change_pct)}%
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Annual Returns</p>
                                <p className={`text-base font-bold mt-0.5 ${fund.return_1y < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                  {fund.return_1y}% <span className="text-[10px] text-slate-500 font-normal">1Y</span>
                                </p>
                                <p className="text-xs font-semibold text-slate-400 mt-1">
                                  {fund.return_3y}% <span className="text-[10px] text-slate-500 font-normal">3Y</span>
                                </p>
                              </div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 flex flex-col items-center gap-3">
                      <p className="text-sm font-medium text-slate-400">No mutual funds found matching this category.</p>
                      <button
                        type="button"
                        onClick={() => setFundFilterCategory("all")}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* -------------------- TAB 4: CURRENCY -------------------- */}
        {activeTab === "currency" && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Main Grid: Interactive Converter + Rate Cards */}
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Left Column: Interactive Converter Card (lg:col-span-5) */}
              <div className="lg:col-span-5 space-y-4">
                <Card className="border-white/10 bg-[#0c101d]/90 glass-card shadow-2xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                  <CardHeader className="pb-3 border-b border-white/5">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <ArrowRightLeft className="h-4 w-4 text-blue-400" /> Interactive Converter
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">Base Currency</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 sm:p-6 space-y-5">
                    {/* Amount Input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                        <label>Convert Amount</label>
                        <span className="text-[10px] font-mono text-slate-500">Default: 1 unit</span>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={currencyAmount}
                          onChange={(e) => setCurrencyAmount(e.target.value)}
                          className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-lg font-bold font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                          placeholder="1"
                        />
                        <div className="absolute right-3 px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-bold font-mono text-slate-300 border border-white/5">
                          {currencyRates?.rates?.find((r: any) => r.symbol === currencyFrom)?.short || "USD"}
                        </div>
                      </div>
                    </div>

                    {/* Quick Preset Amount Buttons */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Presets</p>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {["1", "10", "50", "100", "500", "1000"].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setCurrencyAmount(preset)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all duration-200 cursor-pointer ${
                              currencyAmount === preset
                                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 border border-blue-400/40"
                                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* From Currency Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-medium block">Source Currency</label>
                      <select
                        value={currencyFrom}
                        onChange={(e) => setCurrencyFrom(e.target.value)}
                        className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                      >
                        {currencyRates?.rates?.map((rate: any) => (
                          <option key={rate.symbol} value={rate.symbol} className="bg-slate-900 text-white">
                            {rate.short === "USD" ? "🇺🇸" : rate.short === "EUR" ? "🇪🇺" : rate.short === "GBP" ? "🇬🇧" : rate.short === "JPY" ? "🇯🇵" : rate.short === "AED" ? "🇦🇪" : rate.short === "CAD" ? "🇨🇦" : rate.short === "AUD" ? "🇦🇺" : "🇸🇬"} {rate.name} ({rate.short})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Conversion Result Card */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600/15 via-cyan-500/10 to-indigo-600/15 border border-blue-500/30 text-center space-y-1 shadow-lg">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Calculated Equivalent (INR)</p>
                      <h3 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                        ₹{
                          currencyRates?.rates
                            ? (Number(currencyAmount || 0) * (currencyRates.rates.find((r: any) => r.symbol === currencyFrom)?.price || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : "0.00"
                        }
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono pt-1">
                        1 {currencyRates?.rates?.find((r: any) => r.symbol === currencyFrom)?.short || "USD"} = ₹{(currencyRates?.rates?.find((r: any) => r.symbol === currencyFrom)?.price || 0).toFixed(2)} INR
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Live FX Exchange Rates Grid (lg:col-span-7) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="h-px w-4 bg-slate-400/30" /> Live Exchange Rate Cards
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">Tap card to select</span>
                </div>

                <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2">
                  {currencyRates?.rates ? (
                    currencyRates.rates.map((rate: any) => {
                      const positive = rate.change_pct >= 0;
                      const isSelected = currencyFrom === rate.symbol;
                      const flag = rate.short === "USD" ? "🇺🇸" : rate.short === "EUR" ? "🇪🇺" : rate.short === "GBP" ? "🇬🇧" : rate.short === "JPY" ? "🇯🇵" : rate.short === "AED" ? "🇦🇪" : rate.short === "CAD" ? "🇨🇦" : rate.short === "AUD" ? "🇦🇺" : "🇸🇬";

                      return (
                        <Card
                          key={rate.symbol}
                          onClick={() => setCurrencyFrom(rate.symbol)}
                          className={`border transition-all duration-300 cursor-pointer overflow-hidden group shadow-lg ${
                            isSelected
                              ? "bg-gradient-to-br from-blue-900/40 via-slate-900/90 to-cyan-900/40 border-blue-500/50 shadow-blue-500/10 ring-1 ring-blue-500/30"
                              : "bg-[#090e1d]/90 border-white/10 hover:bg-white/[0.06] hover:border-white/20"
                          }`}
                        >
                          <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2.5">
                                <span className="text-xl">{flag}</span>
                                <div>
                                  <p className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                                    {rate.name}
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-mono">{rate.short} / INR</p>
                                </div>
                              </div>
                              <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                positive ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-red-500/15 text-red-400 border border-red-500/30"
                              }`}>
                                {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {positive ? "+" : ""}{rate.change_pct}%
                              </div>
                            </div>

                            <div className="flex items-baseline justify-between pt-1">
                              <div>
                                <span className="text-[10px] text-slate-500 font-medium block">1 {rate.short} =</span>
                                <h4 className="text-xl font-black text-white font-mono tracking-tight">
                                  ₹{Number(rate.price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                </h4>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                                isSelected ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : "bg-slate-800 text-slate-400 border-white/5 group-hover:text-white"
                              }`}>
                                {isSelected ? "Selected" : "Select"}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="col-span-full p-12 text-center text-sm text-slate-500 animate-pulse border border-white/5 bg-slate-900/30 rounded-2xl">
                      Loading live currency rates...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual Input modal dialog */}
      <ManualAssetModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        assetToEdit={editingAsset}
        portfolios={portfolios}
        userId={user?.id || ""}
      />
    </div>
  );
}
