"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ManualAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetToEdit?: any;
  portfolios: any[];
  userId: string;
}

export function ManualAssetModal({
  isOpen,
  onClose,
  assetToEdit,
  portfolios,
  userId,
}: ManualAssetModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState("equity");
  const [quantity, setQuantity] = useState("");
  const [avgBuyPrice, setAvgBuyPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [isin, setIsin] = useState("");
  const [folio, setFolio] = useState("");

  const isEdit = !!assetToEdit;

  useEffect(() => {
    if (assetToEdit) {
      setName(assetToEdit.name || "");
      setAssetType(assetToEdit.asset_type || "equity");
      setQuantity(assetToEdit.quantity ? String(assetToEdit.quantity) : "");
      setAvgBuyPrice(
        assetToEdit.average_buy_price ? String(assetToEdit.average_buy_price) : ""
      );
      setCurrentPrice(
        assetToEdit.current_price ? String(assetToEdit.current_price) : ""
      );
      setIsin(assetToEdit.isin || "");
      setFolio(assetToEdit.folio || "");
    } else {
      // Reset
      setName("");
      setAssetType("equity");
      setQuantity("");
      setAvgBuyPrice("");
      setCurrentPrice("");
      setIsin("");
      setFolio("");
    }
  }, [assetToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Please enter a name");
    if (!quantity || Number(quantity) <= 0)
      return toast.error("Quantity must be greater than 0");
    if (!currentPrice || Number(currentPrice) < 0)
      return toast.error("Current price cannot be negative");

    setLoading(true);

    try {
      let portfolioId = portfolios[0]?.id;

      // 1. Create a default manual portfolio if none exists
      if (!portfolioId) {
        const { data: newPortfolio, error: pfError } = await supabase
          .from("portfolios")
          .insert({
            user_id: userId,
            name: "My Portfolio",
            upload_status: "completed",
            total_invested: 0,
            total_value: 0,
          })
          .select("id")
          .single();

        if (pfError) throw pfError;
        portfolioId = newPortfolio.id;
      }

      const parsedQty = Number(quantity);
      const parsedAvgBuy = avgBuyPrice ? Number(avgBuyPrice) : 0;
      const parsedCurrent = Number(currentPrice);

      const costBasis = parsedAvgBuy * parsedQty;
      const marketValue = parsedCurrent * parsedQty;

      // DB Constraint: assets_ticker_or_scheme check (ticker is not null or scheme_code is not null)
      const identifier = isin.trim() || `MANUAL-${Date.now()}`;
      const isEquity = assetType === "equity";

      const assetData: any = {
        portfolio_id: portfolioId,
        user_id: userId,
        asset_type: assetType,
        asset_class: "other",
        name: name.trim(),
        quantity: parsedQty,
        average_buy_price: parsedAvgBuy || null,
        cost_basis: costBasis || null,
        current_price: parsedCurrent,
        market_value: marketValue,
        isin: isin.trim() || null,
        folio: folio.trim() || null,
        ticker: isEquity ? identifier : null,
        scheme_code: !isEquity ? identifier : null,
        metadata: {},
      };

      if (isEdit) {
        const { error } = await supabase
          .from("assets")
          .update(assetData)
          .eq("id", assetToEdit.id);

        if (error) throw error;
        toast.success("Asset updated successfully");
      } else {
        const { error } = await supabase.from("assets").insert(assetData);
        if (error) throw error;
        toast.success("Asset added successfully");
      }

      // Refresh portfolio totals in the background
      const { data: allAssets } = await supabase
        .from("assets")
        .select("market_value, cost_basis")
        .eq("portfolio_id", portfolioId);

      if (allAssets) {
        const totalVal = allAssets.reduce((sum, a) => sum + Number(a.market_value || 0), 0);
        const totalCost = allAssets.reduce((sum, a) => sum + Number(a.cost_basis || 0), 0);
        await supabase
          .from("portfolios")
          .update({
            total_value: totalVal,
            total_invested: totalCost,
          })
          .eq("id", portfolioId);
      }

      router.refresh();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save asset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-slate-900/95 border-white/10 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            {isEdit ? "Edit Asset Holding" : "Add Asset Holding"}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            {isEdit
              ? "Modify values for your manual holding"
              : "Create a manual holding in your portfolio"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label className="text-xs text-slate-300">Asset Name</Label>
            <Input
              placeholder="e.g. Reliance Industries, Parag Parikh Flexi Cap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-950/60 border-white/10 text-sm text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Asset Type</Label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                className="w-full h-10 rounded-md bg-slate-950/60 border border-white/10 text-sm text-white px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="equity">Equity (Stock)</option>
                <option value="mutual_fund">Mutual Fund</option>
                <option value="etf">ETF</option>
                <option value="bond">Bond</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Quantity (Units)</Label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 15.00"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-slate-950/60 border-white/10 text-sm text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Average Buy Price (₹)</Label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 2400.00 (Optional)"
                value={avgBuyPrice}
                onChange={(e) => setAvgBuyPrice(e.target.value)}
                className="bg-slate-950/60 border-white/10 text-sm text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Current Price / NAV (₹)</Label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 2800.00"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                className="bg-slate-950/60 border-white/10 text-sm text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">ISIN Code</Label>
              <Input
                placeholder="e.g. INE002A01018 (Optional)"
                value={isin}
                onChange={(e) => setIsin(e.target.value)}
                className="bg-slate-950/60 border-white/10 text-sm text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Folio Number</Label>
              <Input
                placeholder="e.g. 91028374 (Optional)"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                className="bg-slate-950/60 border-white/10 text-sm text-white"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-white/5 flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-slate-300 hover:text-white"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold flex items-center gap-1.5"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Update Holding" : "Add Holding"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
