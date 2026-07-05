import re

with open("app/api/v1/market.py", "r") as f:
    content = f.read()

content = content.replace(
    "from app.services.market_service import get_indices, get_market_summary, get_top_funds",
    "from app.services.market_service import get_indices, get_market_summary, get_top_funds, get_currency_rates"
)

currency_endpoint = """
@router.get("/currency")
def currency():
    return get_currency_rates()
"""

if "def currency(" not in content:
    content += currency_endpoint

with open("app/api/v1/market.py", "w") as f:
    f.write(content)
