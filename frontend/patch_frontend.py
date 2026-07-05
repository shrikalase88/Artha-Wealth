import re

with open("app/(dashboard)/dashboard/dashboard-view.tsx", "r") as f:
    content = f.read()

# 1. Add imports
content = content.replace(
    'import { LineChart, BarChart } from "lucide-react";',
    'import { LineChart, BarChart as BarChartIcon } from "lucide-react";\nimport { BarChart, DonutChart } from "@tremor/react";\nimport { CustomDonutChart } from "@/components/ui/custom-donut-chart";'
)
content = content.replace(
    "Activity, Briefcase, Compass",
    "Activity, Briefcase, Compass, Coins, ArrowRightLeft"
)

# 2. Add currency state and fetch
state_block = """  const [marketSummary, setMarketSummary] = useState<any>(null);"""
new_state_block = """  const [marketSummary, setMarketSummary] = useState<any>(null);
  const [currencyRates, setCurrencyRates] = useState<any>(null);
  const [currencyAmount, setCurrencyAmount] = useState<string>("1000");
  const [currencyFrom, setCurrencyFrom] = useState<string>("USDINR=X");
"""
if "setCurrencyRates" not in content:
    content = content.replace(state_block, new_state_block)

fetch_logic = """    const fetchMarket = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/market/summary`);"""
new_fetch_logic = """    const fetchMarket = async () => {
      try {
        const [resMarket, resCurrency] = await Promise.all([
          fetch(`${BACKEND_URL}/api/v1/market/summary`),
          fetch(`${BACKEND_URL}/api/v1/market/currency`)
        ]);
        if (resMarket.ok) {
          const data = await resMarket.json();
          setMarketSummary(data);
        }
        if (resCurrency.ok) {
          const cData = await resCurrency.json();
          setCurrencyRates(cData);
        }"""
if "resCurrency" not in content:
    content = re.sub(
        r'const fetchMarket = async \(\) => \{\s*try \{\s*const res = await fetch\(`\$\{BACKEND_URL\}/api/v1/market/summary`\);\s*if \(!res\.ok\) throw new Error\("Failed"\);\s*const data = await res\.json\(\);\s*setMarketSummary\(data\);',
        new_fetch_logic,
        content
    )

# 3. Add Currency tab
tabs_old = """                { id: "market", name: "Markets", icon: Activity },
                { id: "funds", name: "Funds", icon: Compass },
                { id: "portfolio", name: "Portfolio", icon: Briefcase }"""
tabs_new = """                { id: "market", name: "Markets", icon: Activity },
                { id: "funds", name: "Funds", icon: Compass },
                { id: "currency", name: "Currency", icon: Coins },
                { id: "portfolio", name: "Portfolio", icon: Briefcase }"""
content = content.replace(tabs_old, tabs_new)

with open("app/(dashboard)/dashboard/dashboard-view.tsx", "w") as f:
    f.write(content)
