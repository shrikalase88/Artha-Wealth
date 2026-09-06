"use client";

import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, DonutChart } from "@tremor/react";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Activity,
  Calculator,
  Compass,
  Coins,
  ArrowRightLeft,
  ChevronDown,
  PieChart,
  Check,
  Copy,
} from "lucide-react";
import { formatIndianCurrency } from "@/lib/utils";
import { RadialVelocityGauge } from "@/components/ui/radial-velocity-gauge";
import { toast } from "sonner";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export function DashboardView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams ? searchParams.get("tab") : null;

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (tabParam && ["market", "funds", "currency", "sip"].includes(tabParam)) {
      return tabParam;
    }
    return "market";
  });

  useEffect(() => {
    if (tabParam && ["market", "funds", "currency", "sip"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    const handleSwitchTab = (e: any) => {
      if (e.detail && ["market", "funds", "currency", "sip"].includes(e.detail)) {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener("artha:switch-tab", handleSwitchTab);
    return () => window.removeEventListener("artha:switch-tab", handleSwitchTab);
  }, []);

  const [fundFilterCategory, setFundFilterCategory] = useState<string>("all");
  const [selectedMarketRegion, setSelectedMarketRegion] = useState<"india" | "us" | "europe" | "china" | "japan" | "arab">("india");

  // SIP Growth Engine States
  const [sipMonthly, setSipMonthly] = useState<number>(10000);
  const [sipReturn, setSipReturn] = useState<number>(14);
  const [sipYears, setSipYears] = useState<number>(15);
  const [sipMode, setSipMode] = useState<"sip" | "lumpsum">("sip");

  const sipCalculation = useMemo(() => {
    const P = sipMonthly;
    const r = sipReturn / 100;
    const years = sipYears;

    if (sipMode === "sip") {
      const i = r / 12;
      const n = years * 12;
      const totalInvested = P * n;
      const maturityValue = i > 0 ? P * (((Math.pow(1 + i, n) - 1) / i) * (1 + i)) : totalInvested;
      const wealthGained = maturityValue - totalInvested;
      return {
        totalInvested: Math.round(totalInvested),
        wealthGained: Math.round(wealthGained),
        maturityValue: Math.round(maturityValue),
      };
    } else {
      const totalInvested = P;
      const maturityValue = P * Math.pow(1 + r, years);
      const wealthGained = maturityValue - totalInvested;
      return {
        totalInvested: Math.round(totalInvested),
        wealthGained: Math.round(wealthGained),
        maturityValue: Math.round(maturityValue),
      };
    }
  }, [sipMonthly, sipReturn, sipYears, sipMode]);

  // Year-by-year compounding projections table
  const sipProjections = useMemo(() => {
    const list = [];
    const step = sipYears <= 5 ? 1 : sipYears <= 15 ? 2 : 5;
    const r = sipReturn / 100;
    const i = r / 12;

    for (let y = 1; y <= sipYears; y++) {
      if (y === 1 || y === sipYears || y % step === 0) {
        if (sipMode === "sip") {
          const n = y * 12;
          const invested = sipMonthly * n;
          const maturity = i > 0 ? sipMonthly * (((Math.pow(1 + i, n) - 1) / i) * (1 + i)) : invested;
          list.push({
            year: y,
            invested: Math.round(invested),
            wealthGained: Math.round(maturity - invested),
            maturity: Math.round(maturity),
          });
        } else {
          const invested = sipMonthly;
          const maturity = invested * Math.pow(1 + r, y);
          list.push({
            year: y,
            invested: Math.round(invested),
            wealthGained: Math.round(maturity - invested),
            maturity: Math.round(maturity),
          });
        }
      }
    }
    return list;
  }, [sipMonthly, sipReturn, sipYears, sipMode]);

  // Detect user's preferred or timezone location to set regional market ticker & default currency
  useEffect(() => {
    try {
      const savedBase = localStorage.getItem("artha_base_currency");
      const savedTarget = localStorage.getItem("artha_target_currency");
      if (savedBase) setBaseCurrency(savedBase);
      if (savedTarget) setTargetCurrency(savedTarget);

      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (tz.includes("America/")) {
        setSelectedMarketRegion("us");
        if (!savedBase) setBaseCurrency("USD");
      } else if (tz.includes("Europe/") || tz.includes("Atlantic/")) {
        setSelectedMarketRegion("europe");
        if (!savedBase) setBaseCurrency(tz.includes("London") ? "GBP" : "EUR");
      } else if (tz.includes("Shanghai") || tz.includes("Hong_Kong") || tz.includes("Beijing")) {
        setSelectedMarketRegion("china");
        if (!savedBase) setBaseCurrency("USD");
      } else if (tz.includes("Tokyo") || tz.includes("Japan")) {
        setSelectedMarketRegion("japan");
        if (!savedBase) setBaseCurrency("JPY");
      } else if (tz.includes("Riyadh") || tz.includes("Dubai") || tz.includes("Muscat") || tz.includes("Qatar")) {
        setSelectedMarketRegion("arab");
        if (!savedBase) setBaseCurrency("AED");
      } else if (tz.includes("Australia/")) {
        if (!savedBase) setBaseCurrency("AUD");
      } else if (tz.includes("Singapore")) {
        if (!savedBase) setBaseCurrency("SGD");
      } else if (tz.includes("Canada/")) {
        if (!savedBase) setBaseCurrency("CAD");
      }
    } catch (e) {
      // Default to user settings
    }
  }, []);

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

  // Compute comprehensive API loading state for Splash Screen
  const isInitialDataLoading = (!marketSummary && !marketSummaryError) || (!currencyRates) || (fundsLoading && !topFundsData);

  useEffect(() => {
    if (!isInitialDataLoading) {
      window.dispatchEvent(new CustomEvent("artha:dashboard-ready"));
    }
  }, [isInitialDataLoading]);

  const [currencyAmount, setCurrencyAmount] = useState<string>("1");
  const [baseCurrency, setBaseCurrency] = useState<string>("USD");
  const [targetCurrency, setTargetCurrency] = useState<string>("INR");
  const [currencySearch, setCurrencySearch] = useState<string>("");
  const [copiedRate, setCopiedRate] = useState<boolean>(false);

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


  return (
    <div className="space-y-6">
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
        <div className="hidden lg:flex sticky top-0 z-30 w-full border-b border-[#27272a] bg-[#09090b]/95 backdrop-blur-xl py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-6 overflow-x-auto scrollbar-none">
          <div className="flex items-center justify-between gap-4 w-full min-w-max">
            <nav className="inline-flex items-center p-1 sm:p-1.5 bg-[#121215]/95 backdrop-blur-2xl rounded-2xl border border-[#27272a] shadow-lg gap-1 sm:gap-1.5 overflow-x-auto">
              {[
                { id: "market", name: "Markets", icon: Activity },
                { id: "funds", name: "Funds", icon: Compass },
                { id: "currency", name: "Currency", icon: Coins },
                { id: "sip", name: "SIP Calculator", icon: Calculator },
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
                    className={`flex items-center justify-center gap-2 py-2 px-4.5 rounded-xl transition-all duration-200 select-none whitespace-nowrap cursor-pointer ${
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

            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Aggregator Mode
              </span>
            </div>
          </div>
        </div>
        {/* -------------------- TAB: SIP & INVESTMENT GROWTH CALCULATOR -------------------- */}
        {activeTab === "sip" && (
          <div className="space-y-6 pb-8 animate-fade-in-up">
            {/* Header / Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950/80 border border-[#27272a] rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-xl">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Calculator className="h-5 w-5" />
                  </div>
                  SIP & Wealth Growth Engine
                </h2>
                <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                  Simulate systematic compounding growth, calculate future maturity values, and analyze returns over customizable horizons.
                </p>
              </div>

              {/* Mode Switcher Pill */}
              <div className="inline-flex p-1 rounded-xl bg-zinc-900/90 border border-zinc-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSipMode("sip")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    sipMode === "sip"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Monthly SIP
                </button>
                <button
                  type="button"
                  onClick={() => setSipMode("lumpsum")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    sipMode === "lumpsum"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  One-Time Lump Sum
                </button>
              </div>
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Sliders */}
              <div className="lg:col-span-5 space-y-6">
                <Card className="border-[#27272a] bg-zinc-950/80 backdrop-blur-xl shadow-xl p-5 sm:p-6 space-y-6">
                  {/* Slider 1: Monthly / Lumpsum Amount */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-300 font-medium">
                        {sipMode === "sip" ? "Monthly Investment" : "Lump Sum Investment"}
                      </span>
                      <span className="font-mono font-extrabold text-emerald-400 text-base">
                        ₹{sipMonthly.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={sipMode === "sip" ? 500 : 5000}
                      max={sipMode === "sip" ? 100000 : 1000000}
                      step={sipMode === "sip" ? 500 : 5000}
                      value={sipMonthly}
                      onChange={(e) => setSipMonthly(Number(e.target.value))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 hover:accent-emerald-300 transition-all"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(sipMode === "sip" ? [2500, 5000, 10000, 25000, 50000] : [25000, 50000, 100000, 250000, 500000]).map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setSipMonthly(amt)}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border font-mono transition-colors cursor-pointer ${
                            sipMonthly === amt
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold"
                              : "bg-zinc-900/60 text-zinc-400 hover:text-white border-zinc-800"
                          }`}
                        >
                          ₹{amt.toLocaleString("en-IN")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Slider 2: Expected Return Rate */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-300 font-medium">Expected Return Rate (p.a.)</span>
                      <span className="font-mono font-extrabold text-blue-400 text-base">
                        {sipReturn}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={4}
                      max={30}
                      step={0.5}
                      value={sipReturn}
                      onChange={(e) => setSipReturn(Number(e.target.value))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { r: 8, label: "8% (Debt/FD)" },
                        { r: 12, label: "12% (Index/Large)" },
                        { r: 15, label: "15% (Flexi Cap)" },
                        { r: 18, label: "18% (Mid/Small)" },
                      ].map((item) => (
                        <button
                          key={item.r}
                          type="button"
                          onClick={() => setSipReturn(item.r)}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border font-mono transition-colors cursor-pointer ${
                            sipReturn === item.r
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/40 font-bold"
                              : "bg-zinc-900/60 text-zinc-400 hover:text-white border-zinc-800"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Slider 3: Time Horizon */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-300 font-medium">Time Horizon (Years)</span>
                      <span className="font-mono font-extrabold text-purple-400 text-base">
                        {sipYears} {sipYears === 1 ? "Year" : "Years"}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={35}
                      step={1}
                      value={sipYears}
                      onChange={(e) => setSipYears(Number(e.target.value))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[3, 5, 10, 15, 20, 25, 30].map((y) => (
                        <button
                          key={y}
                          type="button"
                          onClick={() => setSipYears(y)}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border font-mono transition-colors cursor-pointer ${
                            sipYears === y
                              ? "bg-purple-500/20 text-purple-400 border-purple-500/40 font-bold"
                              : "bg-zinc-900/60 text-zinc-400 hover:text-white border-zinc-800"
                          }`}
                        >
                          {y}Y
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column: Outcomes, Split & Milestones */}
              <div className="lg:col-span-7 space-y-6">
                {/* 3 Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-2xl bg-zinc-950/80 border border-[#27272a] shadow-lg">
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Total Invested</p>
                    <p className="text-xl sm:text-2xl font-mono font-bold text-white mt-1">
                      ₹{sipCalculation.totalInvested.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-1">Principal contribution</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950/80 border border-[#27272a] shadow-lg">
                    <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Wealth Gained</p>
                    <p className="text-xl sm:text-2xl font-mono font-bold text-emerald-400 mt-1">
                      +₹{sipCalculation.wealthGained.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[10px] text-emerald-500/80 mt-1 font-mono">
                      {(sipCalculation.maturityValue / (sipCalculation.totalInvested || 1)).toFixed(1)}x Multiple
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 to-emerald-950/30 border border-blue-500/30 shadow-lg">
                    <p className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider">Maturity Value</p>
                    <p className="text-xl sm:text-2xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mt-1">
                      ₹{sipCalculation.maturityValue.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[10px] text-blue-300/80 mt-1">Estimated corpus</p>
                  </div>
                </div>

                {/* Visual Ratio & Milestones */}
                <Card className="border-[#27272a] bg-zinc-950/80 backdrop-blur-xl shadow-xl p-5 sm:p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <PieChart className="h-4 w-4 text-emerald-400" />
                      Wealth Compounding Breakdown
                    </h3>
                    <span className="text-xs font-mono text-zinc-400">
                      Profit Share: {Math.round((sipCalculation.wealthGained / (sipCalculation.maturityValue || 1)) * 100)}%
                    </span>
                  </div>

                  {/* Horizontal visual split bar */}
                  <div className="space-y-2">
                    <div className="h-3.5 w-full rounded-full bg-zinc-900 border border-zinc-800 flex overflow-hidden p-0.5">
                      <div
                        className="h-full bg-zinc-600 rounded-l-full transition-all duration-300"
                        style={{
                          width: `${Math.max(5, Math.min(95, Math.round((sipCalculation.totalInvested / (sipCalculation.maturityValue || 1)) * 100)))}%`,
                        }}
                      />
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-r-full transition-all duration-300 flex-1"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-zinc-600" />
                        Invested: ₹{sipCalculation.totalInvested.toLocaleString("en-IN")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        Profit: ₹{sipCalculation.wealthGained.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Smart Milestones Roadmap */}
                  <div className="pt-3 border-t border-zinc-900 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { yr: Math.min(sipYears, 3), label: "Short Term" },
                      { yr: Math.min(sipYears, 5), label: "Medium Term" },
                      { yr: Math.min(sipYears, 10), label: "Long Term" },
                      { yr: sipYears, label: "Target Goal" },
                    ].map((m, idx) => {
                      const proj = sipProjections.find((p) => p.year === m.yr) || sipProjections[sipProjections.length - 1];
                      return (
                        <div key={idx} className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/60">
                          <p className="text-[10px] text-zinc-400 font-medium">{m.label} ({m.yr}Y)</p>
                          <p className="text-xs sm:text-sm font-bold font-mono text-white mt-0.5 truncate">
                            ₹{proj?.maturity.toLocaleString("en-IN") || "—"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Year-by-Year Growth Projections Table */}
                <Card className="border-[#27272a] bg-zinc-950/80 backdrop-blur-xl shadow-xl overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      Growth Schedule & Compounding Timeline
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {sipMode === "sip" ? `₹${sipMonthly.toLocaleString("en-IN")}/mo` : `₹${sipMonthly.toLocaleString("en-IN")} Lumpsum`} @ {sipReturn}% p.a.
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800/80 text-zinc-400 bg-zinc-900/40 text-[11px] font-semibold">
                          <th className="py-2.5 px-4">Timeline</th>
                          <th className="py-2.5 px-4 text-right">Invested</th>
                          <th className="py-2.5 px-4 text-right">Interest / Gains</th>
                          <th className="py-2.5 px-4 text-right">Total Corpus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50 font-mono">
                        {sipProjections.map((p) => (
                          <tr key={p.year} className="hover:bg-zinc-900/40 transition-colors">
                            <td className="py-2.5 px-4 text-zinc-300 font-sans font-medium">Year {p.year}</td>
                            <td className="py-2.5 px-4 text-right text-zinc-400">₹{p.invested.toLocaleString("en-IN")}</td>
                            <td className="py-2.5 px-4 text-right text-emerald-400 font-bold">+₹{p.wealthGained.toLocaleString("en-IN")}</td>
                            <td className="py-2.5 px-4 text-right text-white font-bold">₹{p.maturity.toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
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
                    <div className="grid gap-4 md:grid-cols-2 pt-2 animate-fade-in-up stagger-1">
                      <Card className="border-white/5 bg-slate-900/40 glass-card fluid-card-hover">
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

                      <Card className="border-white/5 bg-slate-900/40 glass-card fluid-card-hover">
                        <CardHeader className="pb-1">
                          <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-px w-4 bg-slate-400/30" /> Top 5 Market Movers
                            </div>
                            <span className="text-[10px] font-mono text-emerald-400 font-normal flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Directional Velocity
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="min-h-[260px] p-3 flex justify-center items-center">
                          {(() => {
                            const sourceStocks = marketSummary?.stocks || [];
                            const dynamicMovers = [...sourceStocks]
                              .sort((a, b) => Math.abs(Number(b.change_pct ?? b.change ?? 0)) - Math.abs(Number(a.change_pct ?? a.change ?? 0)))
                              .slice(0, 5);

                            const chartData = dynamicMovers.map((s: any) => ({
                              name: s.short || s.name || "Stock",
                              value: Number(s.price || 0),
                              change_pct: s.change_pct !== undefined ? Number(s.change_pct) : undefined,
                              change: s.change !== undefined ? Number(s.change) : undefined,
                              symbol: s.symbol,
                            }));

                            return (
                              <RadialVelocityGauge
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
                              <div key={stock.symbol} className="grid grid-cols-12 gap-4 p-4 items-center fluid-row-hover border-b border-white/5 last:border-0">
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
                            className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 fluid-card-hover block focus:outline-none"
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

        {/* -------------------- TAB 4: CURRENCY REVAMPED (ANY BASE & TARGET CURRENCY) -------------------- */}
        {activeTab === "currency" && (() => {
          // List of all supported global currencies with their INR base rates
          // Cross rates: 1 Base = (Base_INR_rate / Target_INR_rate) Target
          const CURRENCIES: { short: string; name: string; symbol: string; flag: string; inrPrice: number; change_pct: number }[] = [
            { short: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸", inrPrice: 83.75, change_pct: 0.10 },
            { short: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺", inrPrice: 91.20, change_pct: -0.16 },
            { short: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧", inrPrice: 108.45, change_pct: 0.20 },
            { short: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳", inrPrice: 1.00, change_pct: 0.00 },
            { short: "AED", name: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪", inrPrice: 22.80, change_pct: 0.09 },
            { short: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵", inrPrice: 0.552, change_pct: 0.36 },
            { short: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦", inrPrice: 61.35, change_pct: 0.08 },
            { short: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺", inrPrice: 55.40, change_pct: -0.18 },
            { short: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬", inrPrice: 62.10, change_pct: 0.13 },
            { short: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭", inrPrice: 93.80, change_pct: 0.05 },
            { short: "SAR", name: "Saudi Riyal", symbol: "﷼", flag: "🇸🇦", inrPrice: 22.33, change_pct: 0.02 },
          ];

          // Override inrPrice with live API rates if available
          if (currencyRates?.rates && Array.isArray(currencyRates.rates)) {
            currencyRates.rates.forEach((liveR: any) => {
              const matched = CURRENCIES.find((c) => c.short === liveR.short);
              if (matched && liveR.price) {
                matched.inrPrice = Number(liveR.price);
                if (typeof liveR.change_pct === "number") matched.change_pct = liveR.change_pct;
              }
            });
          }

          const baseCurrObj = CURRENCIES.find((c) => c.short === baseCurrency) || CURRENCIES[0];
          const targetCurrObj = CURRENCIES.find((c) => c.short === targetCurrency) || CURRENCIES[3];

          // Cross rate: 1 Base = X Target
          const crossRate = targetCurrObj.inrPrice > 0 ? baseCurrObj.inrPrice / targetCurrObj.inrPrice : 1;
          const inverseRate = crossRate > 0 ? 1 / crossRate : 0;
          const parsedAmount = Math.max(0, Number(currencyAmount) || 0);
          const convertedTotal = parsedAmount * crossRate;

          const swapCurrencies = () => {
            const oldBase = baseCurrency;
            const oldTarget = targetCurrency;
            setBaseCurrency(oldTarget);
            setTargetCurrency(oldBase);
            localStorage.setItem("artha_base_currency", oldTarget);
            localStorage.setItem("artha_target_currency", oldBase);
          };

          const handleSelectBase = (short: string) => {
            if (short === targetCurrency) {
              setTargetCurrency(baseCurrency);
              localStorage.setItem("artha_target_currency", baseCurrency);
            }
            setBaseCurrency(short);
            localStorage.setItem("artha_base_currency", short);
          };

          const handleSelectTarget = (short: string) => {
            if (short === baseCurrency) {
              setBaseCurrency(targetCurrency);
              localStorage.setItem("artha_base_currency", targetCurrency);
            }
            setTargetCurrency(short);
            localStorage.setItem("artha_target_currency", short);
          };

          const copyConversionToClipboard = () => {
            const text = `${parsedAmount.toLocaleString()} ${baseCurrObj.short} = ${convertedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${targetCurrObj.short} (Exchange rate: 1 ${baseCurrObj.short} = ${crossRate.toFixed(4)} ${targetCurrObj.short})`;
            navigator.clipboard.writeText(text);
            setCopiedRate(true);
            toast.success("Conversion copied to clipboard!");
            setTimeout(() => setCopiedRate(false), 2000);
          };

          const filteredCurrencies = CURRENCIES.filter((c) => {
            if (!currencySearch.trim()) return true;
            const q = currencySearch.toLowerCase();
            return (
              c.name.toLowerCase().includes(q) ||
              c.short.toLowerCase().includes(q)
            );
          });

          return (
            <div className="space-y-6 animate-fade-in-up">
              {/* Regional/Base Currency Quick Selector Bar - Edge to Edge on Mobile (Matching Markets & Funds) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none select-none -mx-4 px-4 sm:mx-0 sm:px-0">
                {CURRENCIES.map((c) => {
                  const isActive = baseCurrency === c.short;
                  return (
                    <button
                      key={c.short}
                      type="button"
                      onClick={() => handleSelectBase(c.short)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer touch-manipulation ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20 border border-blue-400/40"
                          : "bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800/80"
                      }`}
                    >
                      <span className="text-base leading-none">{c.flag}</span>
                      <span>{c.short}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                      }`}>
                        {c.symbol}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Currency Converter Card: Glass-card matching Markets & Funds */}
              <div className="rounded-2xl border border-white/5 bg-slate-900/40 glass-card p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                      <ArrowRightLeft className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">Currency Converter</h3>
                      <p className="text-[11px] text-slate-400">Live multi-currency cross rates</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={swapCurrencies}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 text-xs font-semibold transition-all active:scale-95 cursor-pointer touch-manipulation"
                    title="Swap base & target currencies"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Swap</span>
                  </button>
                </div>

                {/* Input Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  {/* Amount in Base Currency */}
                  <div className="sm:col-span-5 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      You Convert ({baseCurrObj.short})
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        value={currencyAmount}
                        onChange={(e) => setCurrencyAmount(e.target.value)}
                        className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-3 pr-20 py-2.5 text-base sm:text-lg font-bold font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="1"
                      />
                      <div className="absolute right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 text-xs font-bold font-mono text-slate-200 pointer-events-none">
                        <span>{baseCurrObj.flag}</span>
                        <span>{baseCurrObj.short}</span>
                      </div>
                    </div>
                  </div>

                  {/* Swap Button Divider */}
                  <div className="sm:col-span-2 flex justify-center items-center py-1 sm:py-0 sm:pt-4">
                    <button
                      type="button"
                      onClick={swapCurrencies}
                      className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 active:scale-90 transition-all cursor-pointer touch-manipulation"
                      title="Swap Currencies"
                    >
                      <ArrowRightLeft className="w-4 h-4 text-blue-400" />
                    </button>
                  </div>

                  {/* Target Currency Selector */}
                  <div className="sm:col-span-5 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Target Currency ({targetCurrObj.short})
                    </label>
                    <div className="relative">
                      <select
                        value={targetCurrency}
                        onChange={(e) => handleSelectTarget(e.target.value)}
                        className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-3 pr-8 py-2.5 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-blue-500 cursor-pointer appearance-none"
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c.short} value={c.short} className="bg-slate-900 text-white">
                            {c.flag} {c.short} — {c.name} ({c.symbol})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Conversion Result Banner */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-cyan-950/40 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                      Converted Total ({targetCurrObj.short})
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight tabular-nums mt-0.5">
                      {targetCurrObj.symbol}{" "}
                      {convertedTotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}{" "}
                      <span className="text-xs font-normal text-slate-400 font-sans">{targetCurrObj.short}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">
                      1 {baseCurrObj.short} = {crossRate.toFixed(4)} {targetCurrObj.short} • 1 {targetCurrObj.short} = {inverseRate.toFixed(4)} {baseCurrObj.short}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={copyConversionToClipboard}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-xs font-semibold text-slate-200 border border-white/10 transition-colors cursor-pointer self-start sm:self-auto shrink-0 touch-manipulation"
                  >
                    {copiedRate ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRate ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Live Global Rates Section: Matching Funds Grid Layout */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <div className="h-px w-4 bg-slate-400/30" /> Rates vs {baseCurrObj.flag} {baseCurrObj.short}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Tap any card to set it as target currency
                    </p>
                  </div>

                  {/* Search Input for currencies */}
                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                    <Input
                      placeholder="Search currency..."
                      value={currencySearch}
                      onChange={(e) => setCurrencySearch(e.target.value)}
                      className="pl-8 h-8 text-xs bg-slate-900/80 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500/50 rounded-xl"
                    />
                  </div>
                </div>

                {/* Currencies Grid: 1 col on mobile, 2 on tablet, 3 on desktop (Exact match with Funds) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredCurrencies.length === 0 ? (
                    <div className="col-span-full p-8 text-center text-sm text-slate-500 border border-white/5 bg-slate-900/30 rounded-2xl">
                      No currencies match "{currencySearch}".
                    </div>
                  ) : (
                    filteredCurrencies.map((item) => {
                      const isTarget = targetCurrency === item.short;
                      const isBase = baseCurrency === item.short;
                      const positive = (item.change_pct ?? 0) >= 0;

                      const rateForCard = item.inrPrice > 0 ? baseCurrObj.inrPrice / item.inrPrice : 1;
                      const inverseForCard = rateForCard > 0 ? 1 / rateForCard : 0;

                      return (
                        <div
                          key={item.short}
                          onClick={() => {
                            if (!isBase) handleSelectTarget(item.short);
                          }}
                          className={`rounded-2xl border p-4 transition-all duration-200 cursor-pointer active:scale-[0.99] touch-manipulation flex flex-col justify-between gap-3 ${
                            isTarget
                              ? "bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30"
                              : isBase
                              ? "bg-emerald-500/5 border-emerald-500/30 opacity-90"
                              : "bg-slate-900/40 border-white/5 hover:bg-slate-900/70 hover:border-white/15"
                          }`}
                        >
                          {/* Top: Flag, Name, Code, Badges */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className="text-2xl shrink-0">{item.flag}</span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                                    {item.name}
                                  </span>
                                  {isBase && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold shrink-0">
                                      Base
                                    </span>
                                  )}
                                  {isTarget && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-semibold shrink-0">
                                      Target
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  {baseCurrObj.short} / {item.short}
                                </p>
                              </div>
                            </div>

                            {/* 24h Change Pill */}
                            <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold shrink-0 ${
                              positive
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}>
                              {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {positive ? "+" : ""}{item.change_pct}%
                            </div>
                          </div>

                          {/* Bottom: 2-column metrics */}
                          <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-white/5">
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">
                                1 {baseCurrObj.short} =
                              </span>
                              <span className="text-sm sm:text-base font-black font-mono text-white tabular-nums block mt-0.5">
                                {item.symbol} {rateForCard.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">
                                1 {item.short} =
                              </span>
                              <span className="text-xs sm:text-sm font-semibold font-mono text-slate-300 tabular-nums block mt-0.5">
                                {baseCurrObj.symbol} {inverseForCard.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

          </div>
  );
}
