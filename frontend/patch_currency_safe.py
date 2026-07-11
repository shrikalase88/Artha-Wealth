import re

with open("app/(dashboard)/dashboard/dashboard-view.tsx", "r") as f:
    content = f.read()

currency_tab = """
        {/* -------------------- TAB 4: CURRENCY -------------------- */}
        {activeTab === "currency" && (
          <div className="md:grid md:grid-cols-3 md:gap-8">
            <div className="mb-8 md:mb-0 md:col-span-1 md:sticky md:top-24 h-fit space-y-3">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                <Coins className="h-4 w-4" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                Global Currency Exchange
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md md:max-w-none">
                Live trusted currency conversion against the Indian Rupee (INR).
              </p>
              
              {/* Currency Converter */}
              <div className="mt-8 pt-8 border-t border-white/5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Convert to INR</h3>
                <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-white/5">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1.5 block">Amount</label>
                    <input 
                      type="number" 
                      value={currencyAmount}
                      onChange={(e) => setCurrencyAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1.5 block">From Currency</label>
                    <select 
                      value={currencyFrom}
                      onChange={(e) => setCurrencyFrom(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      {currencyRates?.rates?.map((rate: any) => (
                        <option key={rate.symbol} value={rate.symbol}>{rate.name} ({rate.short})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-center pt-2">
                    <ArrowRightLeft className="h-4 w-4 text-slate-500" />
                  </div>
                  
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-blue-400 font-semibold mb-1">Converted Value (INR)</p>
                    <p className="text-lg font-bold text-white font-mono">
                      ₹{
                        currencyRates?.rates
                          ? (Number(currencyAmount) * (currencyRates.rates.find((r:any) => r.symbol === currencyFrom)?.price || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : "0.00"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <div className="h-px w-4 bg-slate-400/30" /> Live Exchange Rates
              </h3>
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {currencyRates?.rates ? currencyRates.rates.map((rate: any) => {
                  const positive = rate.change_pct >= 0;
                  return (
                    <Card key={rate.symbol} className="border-white/5 bg-slate-900/40 glass-card hover:bg-white/5 transition-colors group">
                      <CardContent className="p-4 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-xs font-semibold text-slate-300">{rate.name}</p>
                            <p className="text-[10px] text-slate-500">{rate.short}/INR</p>
                          </div>
                          {positive ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500/70" /> : <TrendingDown className="h-3.5 w-3.5 text-red-500/70" />}
                        </div>
                        <div>
                          <p className="text-lg font-bold text-white font-mono tracking-tight">₹{Number(rate.price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</p>
                          <p className={`text-[10px] font-mono mt-0.5 ${positive ? "text-emerald-400" : "text-red-400"}`}>
                            {positive ? "+" : ""}{rate.change_pct}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                }) : (
                  <div className="col-span-full p-8 text-center text-sm text-slate-500 animate-pulse">
                    Loading live currency rates...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
"""

# Find exact target for injection
target_string = "      {/* Manual Input modal dialog */}"
if target_string in content and "{/* -------------------- TAB 4: CURRENCY -------------------- */}" not in content:
    content = content.replace(target_string, currency_tab + "\n      " + target_string)
    with open("app/(dashboard)/dashboard/dashboard-view.tsx", "w") as f:
        f.write(content)
    print("SUCCESS")
else:
    print("FAILED or already injected")
