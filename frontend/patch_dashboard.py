import re

with open("app/(dashboard)/dashboard/dashboard-view.tsx", "r") as f:
    content = f.read()

# 1. Active Tab
content = content.replace(
    'const [activeTab, setActiveTab] = useState("portfolio");',
    'const [activeTab, setActiveTab] = useState("market");'
)

# 2. Reorder Tabs
old_tabs = """              {[
                { id: "portfolio", name: "Portfolio", icon: Briefcase },
                { id: "market", name: "Markets", icon: Activity },
                { id: "funds", name: "Funds", icon: Compass }
              ].map((tab) => {"""
new_tabs = """              {[
                { id: "market", name: "Markets", icon: Activity },
                { id: "funds", name: "Funds", icon: Compass },
                { id: "portfolio", name: "Portfolio", icon: Briefcase }
              ].map((tab) => {"""
content = content.replace(old_tabs, new_tabs)

# 3. Dynamic Sector grid
old_sectors = """              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
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
              </div>"""
new_sectors = """              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {(marketSummary?.sectors || []).map((sector: any) => {
                  const positive = (sector.change_pct || 0) >= 0;
                  return (
                    <Card key={sector.name} className="border-white/5 bg-slate-900/40 glass-card hover:bg-white/5 transition-colors group cursor-default">
                      <CardContent className="p-4 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start mb-3">
                          <p className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">{sector.name}</p>
                          {positive ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500/70" /> : <TrendingDown className="h-3.5 w-3.5 text-red-500/70" />}
                        </div>
                        <div>
                          <p className="text-lg font-bold text-white font-mono tracking-tight">{Number(sector.price || 0).toLocaleString("en-IN")}</p>
                          <p className={`text-[10px] font-mono mt-0.5 ${positive ? "text-emerald-400" : "text-red-400"}`}>
                            {positive ? "+" : ""}{sector.change_pct}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>"""
content = content.replace(old_sectors, new_sectors)

with open("app/(dashboard)/dashboard/dashboard-view.tsx", "w") as f:
    f.write(content)

