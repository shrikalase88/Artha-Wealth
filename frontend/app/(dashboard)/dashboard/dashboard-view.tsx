"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Upload,
  Search,
  Activity,
  Calculator,
  Compass,
  Briefcase,
  ChevronRight,
  Sparkles,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Layers,
  Award,
  PieChart,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  Lock
} from "lucide-react";
import { formatIndianCurrency } from "@/lib/utils";
import { CustomBarChart } from "@/components/ui/custom-bar-chart";
import { CustomDonutChart } from "@/components/ui/custom-donut-chart";
import { ManualAssetModal } from "@/components/manual-asset-modal";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface DashboardViewProps {
  user: any;
  portfolios: any[];
  assets: any[];
}

export function DashboardView({ user, portfolios, assets }: DashboardViewProps) {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState("portfolio");
  const [searchQuery, setSearchQuery] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState("all");

  // Manual input modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);

  // Live market details
  const [marketSummary, setMarketSummary] = useState<any>(null);
  const [marketError, setMarketError] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  // Curated mutual funds aggregator
  const [topFunds, setTopFunds] = useState<any[]>([]);
  const [fundsLoading, setFundsLoading] = useState(false);

  // Calculated Portfolio totals
  const totalValue = assets.reduce((s, a) => s + Number(a.market_value ?? 0), 0);
  const totalCost = assets.reduce((s, a) => s + Number(a.cost_basis ?? 0), 0);
  const hasCostBasis = assets.some((a) => a.cost_basis && Number(a.cost_basis) > 0);
  const totalGain = hasCostBasis ? totalValue - totalCost : null;
  const gainPercent = hasCostBasis && totalCost > 0 ? (totalGain! / totalCost) * 100 : null;

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
  
  // Filtered Assets
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (asset.isin && asset.isin.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = assetTypeFilter === "all" || asset.asset_type === assetTypeFilter;
    return matchesSearch && matchesType;
  });

  // Fetch Live Market Data
  useEffect(() => {
    const checkMarketStatus = () => {
      const now = new Date();
      // IST is UTC+5:30
      const istOffset = 5.5 * 60 * 60 * 1000;
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const istTime = new Date(utc + istOffset);

      const day = istTime.getDay();
      const hours = istTime.getHours();
      const minutes = istTime.getMinutes();

      // Weekend check (0 = Sunday, 6 = Saturday)
      if (day === 0 || day === 6) {
        setIsMarketOpen(false);
        return;
      }
      
      const timeInMinutes = hours * 60 + minutes;
      // BSE/NSE Open: 9:15 AM (555), Close: 3:30 PM (930)
      setIsMarketOpen(timeInMinutes >= 555 && timeInMinutes <= 930);
    };

    async function fetchMarket() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/market/summary`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setMarketSummary(data);
        setMarketError(false);
      } catch {
        setMarketError(true);
      }
      checkMarketStatus();
    }
    
    fetchMarket();
    const interval = setInterval(fetchMarket, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Top Mutual Funds
  useEffect(() => {
    async function fetchFunds() {
      setFundsLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/market/top-funds`);
        if (res.ok) {
          const data = await res.json();
          setTopFunds(data);
        }
      } catch (e) {
        console.error("Failed to load top funds", e);
      } finally {
        setFundsLoading(false);
      }
    }
    if (activeTab === "funds" && topFunds.length === 0) {
      fetchFunds();
    }
  }, [activeTab, topFunds.length]);

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
      {/* Live Market indices ticker at the top */}
      {marketSummary && marketSummary.indices && (
        <div className="relative z-20 flex items-center mx-auto max-w-5xl mt-6 px-6 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-full shadow-lg overflow-x-auto scrollbar-none gap-6 shrink-0">
          <div className={`flex shrink-0 items-center gap-1.5 text-[11px] sm:text-xs font-semibold tracking-wider uppercase pr-4 border-r border-white/10 ${isMarketOpen ? 'text-blue-400' : 'text-slate-400'}`}>
            <Activity className={`h-3.5 w-3.5 ${isMarketOpen ? 'animate-pulse' : ''}`} /> 
            {isMarketOpen ? 'Market Live' : 'Market Closed'}
          </div>
          {marketSummary.indices.map((idx: any) => {
            const change = idx.change ?? 0;
            const positive = change >= 0;
            const Icon = positive ? TrendingUp : TrendingDown;
            return (
              <div key={idx.short} className="flex shrink-0 items-center gap-2 text-xs">
                <span className="font-semibold text-slate-400">{idx.short}</span>
                <span className="font-bold text-white tabular-nums">{Number(idx.price).toLocaleString("en-IN")}</span>
                <span className={`flex items-center gap-0.5 font-medium tabular-nums ${positive ? "text-emerald-400" : "text-red-400"}`}>
                  <Icon className="h-3 w-3" />
                  {positive ? "+" : ""}
                  {change.toFixed(2)}
                  {idx.change_pct !== null && ` (${positive ? "+" : ""}${idx.change_pct.toFixed(2)}%)`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="px-4 sm:px-6 lg:px-8 space-y-6 pt-2 pb-8">
        {/* Navigation Tabs and Manual Entry Trigger */}
        <div className="sticky top-14 lg:top-0 z-30 w-full border-b border-slate-800/80 bg-[#070a13]/80 backdrop-blur-xl py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-6">
          <div className="flex items-center justify-between gap-4">
            <nav className="flex p-1 bg-slate-900/80 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto scrollbar-none">
              {[
                { id: "portfolio", name: "Portfolio", icon: Briefcase },
                { id: "market", name: "Markets", icon: Activity },
                { id: "funds", name: "Funds", icon: Compass }
              ].map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      active
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>

            {user && activeTab === "portfolio" && (
              <Button
                onClick={handleOpenAddModal}
                className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 active:scale-95 p-0 shrink-0"
              >
                <Plus className="h-5 w-5" />
              </Button>
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
                {/* Primary KPI Tiles grid */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <Card className="border-white/5 bg-slate-900/40 glass-card">
                <CardContent className="p-4 space-y-1">
                  <p className="text-[10px] text-slate-200 font-semibold uppercase tracking-wider">Current Portfolio Value</p>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight tabular-nums">
                    {formatIndianCurrency(totalValue)}
                  </h3>
                  {totalGain !== null && (
                    <p className={`text-xs font-semibold flex items-center gap-1 mt-1 ${totalGain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {totalGain >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      <span>{totalGain >= 0 ? "+" : ""}{formatIndianCurrency(totalGain)} ({totalGain >= 0 ? "+" : ""}{gainPercent?.toFixed(1)}%)</span>
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-white/5 bg-slate-900/40 glass-card">
                <CardContent className="p-4 space-y-1">
                  <p className="text-[10px] text-slate-200 font-semibold uppercase tracking-wider">Total Capital Invested</p>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight tabular-nums">
                    {hasCostBasis ? formatIndianCurrency(totalCost) : "—"}
                  </h3>
                  <p className="text-[10px] text-slate-300 mt-1 font-light">Acquisition basis from records</p>
                </CardContent>
              </Card>

              <Card className="border-white/5 bg-slate-900/40 glass-card">
                <CardContent className="p-4 space-y-1">
                  <p className="text-[10px] text-slate-200 font-semibold uppercase tracking-wider">All-Time Gains Status</p>
                  <h3 className={`text-xl sm:text-2xl font-black tracking-tight tabular-nums ${totalGain !== null ? (totalGain >= 0 ? "text-emerald-400" : "text-red-400") : "text-white"}`}>
                    {totalGain !== null ? `${totalGain >= 0 ? "+" : ""}${gainPercent?.toFixed(2)}%` : "—"}
                  </h3>
                  <p className="text-[10px] text-slate-300 mt-1 font-light">Compounding capital progress</p>
                </CardContent>
              </Card>

              <Card className="border-white/5 bg-slate-900/40 glass-card">
                <CardContent className="p-4 space-y-1">
                  <p className="text-[10px] text-slate-200 font-semibold uppercase tracking-wider">Active Statement Sources</p>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {portfolios.filter((p) => p.upload_status === "completed").length} Records
                  </h3>
                  <Link href="/portfolio/upload" className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-0.5 mt-1">
                    Upload statement/screenshot <ChevronRight className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Additional Advanced KPI Tiles */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <Card className="border-white/5 bg-slate-900/40 glass-card">
                <CardContent className="p-4 space-y-1 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Holdings</p>
                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
                      {totalHoldingsCount} Assets
                    </h3>
                  </div>
                  <div className="p-2 rounded bg-blue-500/10 text-blue-400">
                    <Briefcase className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/5 bg-slate-900/40 glass-card">
                <CardContent className="p-4 space-y-1 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Asset Diversification</p>
                    <h3 className={`text-lg sm:text-xl font-bold tracking-tight mt-0.5 ${diversificationColor}`}>
                      {diversificationRating}
                    </h3>
                  </div>
                  <div className="p-2 rounded bg-amber-500/10 text-amber-400">
                    <Layers className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/5 bg-slate-900/40 glass-card">
                <CardContent className="p-4 space-y-1 flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Top Performer</p>
                    <h3 className="text-xs font-bold text-white tracking-tight truncate mt-0.5">
                      {topPerformingAsset}
                    </h3>
                  </div>
                  <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 flex-shrink-0">
                    <Award className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/5 bg-slate-900/40 glass-card">
                <CardContent className="p-4 space-y-1 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Allocation Weights</p>
                    <h3 className="text-xs font-bold text-slate-300 mt-0.5">
                      Stocks: {totalValue > 0 ? Math.round((equitiesTotal / totalValue) * 100) : 0}% / MFs: {totalValue > 0 ? Math.round((mutualFundsTotal / totalValue) * 100) : 0}%
                    </h3>
                  </div>
                  <div className="p-2 rounded bg-violet-500/10 text-violet-400">
                    <PieChart className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </div>

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
          <div className="space-y-8 pb-8">
            {/* Header Section */}
            <div className="flex flex-col gap-2 border-b border-white/10 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <Activity className="h-6 w-6 text-blue-500 animate-pulse" /> Market Analytics
                  </h2>
                  <p className="text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
                    Real-time market insights and sector performance. Data curated for high-level overview and strategic decision making.
                  </p>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Last Updated</p>
                  <p className="text-sm font-semibold text-white mt-1">Just Now</p>
                </div>
              </div>
            </div>

            {/* Indices Cards */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <div className="h-px w-4 bg-slate-400/30" /> Major Indices
              </h3>
              {marketSummary ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {marketSummary.indices.map((idx: any) => {
                    const change = idx.change ?? 0;
                    const positive = change >= 0;
                    return (
                      <Card key={idx.short} className="border-white/5 bg-slate-900/40 glass-card hover:bg-white/5 transition-colors overflow-hidden" style={{ borderBottomWidth: '2px', borderBottomColor: positive ? '#10b981' : '#ef4444' }}>
                        <CardContent className="p-5 flex flex-col justify-between h-full">
                          <div className="flex justify-between items-start mb-4">
                            <p className="text-sm font-bold text-slate-300 uppercase tracking-wide">{idx.name}</p>
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${positive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                              {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {positive ? "+" : ""}{idx.change_pct?.toFixed(2)}%
                            </div>
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-white font-mono tracking-tight">
                              {Number(idx.price).toLocaleString("en-IN")}
                            </h3>
                            <p className={`text-xs font-mono mt-1 ${positive ? "text-emerald-400" : "text-red-400"}`}>
                              {positive ? "+" : ""}{change.toFixed(2)} pts
                            </p>
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
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="h-32 bg-slate-900/40 border border-white/5 rounded-xl glass-card" />
                  ))}
                </div>
              )}
            </div>

            {/* Sector Categories */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="h-px w-4 bg-slate-400/30" /> Sector Performance
                </h3>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  { name: "IT & Tech", value: 41250.45, change: 1.25, trend: "up" },
                  { name: "Banking", value: 48900.20, change: -0.45, trend: "down" },
                  { name: "Pharma", value: 15430.10, change: 2.10, trend: "up" },
                  { name: "Manufacturing", value: 22100.00, change: 0.85, trend: "up" },
                  { name: "Entertainment", value: 8900.50, change: -1.20, trend: "down" },
                  { name: "Automobile", value: 18750.65, change: 0.30, trend: "up" },
                  { name: "Gold / Metals", value: 65400.00, change: 0.15, trend: "up" },
                  { name: "Energy", value: 34000.00, change: 1.80, trend: "up" },
                  { name: "FMCG", value: 52100.80, change: -0.10, trend: "down" },
                  { name: "Chemicals", value: 11050.25, change: 0.50, trend: "up" },
                ].map((sector) => {
                  const positive = sector.trend === "up";
                  return (
                    <Card key={sector.name} className="border-white/5 bg-slate-900/40 glass-card hover:bg-white/5 transition-colors group cursor-default">
                      <CardContent className="p-4 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start mb-3">
                          <p className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">{sector.name}</p>
                          {positive ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500/70" /> : <TrendingDown className="h-3.5 w-3.5 text-red-500/70" />}
                        </div>
                        <div>
                          <p className="text-lg font-bold text-white font-mono tracking-tight">{sector.value.toLocaleString("en-IN")}</p>
                          <p className={`text-[10px] font-mono mt-0.5 ${positive ? "text-emerald-400" : "text-red-400"}`}>
                            {positive ? "+" : ""}{sector.change}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Stocks Listing - Active Movers */}
            <div className="space-y-4 pt-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <div className="h-px w-4 bg-slate-400/30" /> Active Movers
              </h3>
              
              <div className="border border-white/5 bg-slate-900/40 glass-card rounded-xl overflow-hidden">
                {marketSummary && marketSummary.stocks ? (
                  <div className="divide-y divide-white/10">
                    <div className="grid grid-cols-12 gap-4 p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/[0.02]">
                      <div className="col-span-5 sm:col-span-4">Company</div>
                      <div className="col-span-4 sm:col-span-4 text-right">Last Price</div>
                      <div className="col-span-3 sm:col-span-4 text-right">Change</div>
                    </div>
                    {marketSummary.stocks.map((stock: any) => {
                      const change = stock.change ?? 0;
                      const positive = change >= 0;
                      return (
                        <div key={stock.symbol} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors">
                          <div className="col-span-5 sm:col-span-4">
                            <p className="text-sm font-bold text-white tracking-wide">{stock.short}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate pr-2">{stock.name}</p>
                          </div>
                          <div className="col-span-4 sm:col-span-4 text-right">
                            <p className="text-sm font-mono text-white">₹{Number(stock.price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          </div>
                          <div className="col-span-3 sm:col-span-4 flex flex-col items-end justify-center">
                            <span className={`text-xs font-bold font-mono flex items-center gap-1 ${
                              positive ? "text-emerald-400" : "text-red-400"
                            }`}>
                              {positive ? "+" : ""}{change.toFixed(2)}
                            </span>
                            <span className={`text-[10px] font-mono mt-0.5 ${
                              positive ? "text-emerald-500/70" : "text-red-500/70"
                            }`}>
                              ({positive ? "+" : ""}{stock.change_pct?.toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-slate-500 animate-pulse">
                    Loading market data...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* -------------------- TAB 3: MUTUAL FUND AGGREGATOR VIEW -------------------- */}
        {activeTab === "funds" && (
          <div className="md:grid md:grid-cols-3 md:gap-8">
            
            {/* Left Column: Header & Context (Spans 1 column on tablet) */}
            <div className="mb-8 md:mb-0 md:col-span-1 md:sticky md:top-24 h-fit space-y-3">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Compass className="h-4 w-4" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                Curated Mutual Fund Aggregator
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md md:max-w-none">
                Explore top 25 performing funds dynamically pulled from public records. Tap to view sources.
              </p>
            </div>

            {/* Right Column: Interactive Grid */}
            <div className="md:col-span-2 space-y-4">
              {fundsLoading ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 animate-pulse">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="h-32 bg-slate-900/40 border border-white/5 rounded-2xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {topFunds.map((fund) => {
                    const positive = fund.change >= 0;
                    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(fund.name + " Mutual Fund Value Research")}`;
                    
                    const catLower = (fund.category || "").toLowerCase();
                    const colorClasses = catLower.includes("mid") ? "bg-purple-500/10 text-purple-400 border-purple-500/10" :
                                         catLower.includes("small") ? "bg-amber-500/10 text-amber-400 border-amber-500/10" :
                                         catLower.includes("large") || catLower.includes("flexi") ? "bg-blue-500/10 text-blue-400 border-blue-500/10" :
                                         "bg-emerald-500/10 text-emerald-400 border-emerald-500/10";

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
              )}
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
        userId={user.id}
      />
    </div>
  );
}
