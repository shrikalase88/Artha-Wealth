"""Screenshot holdings parser using Gemini API or demo mock extraction."""

import base64
import json
import logging
from decimal import Decimal
from typing import TypedDict
import httpx

logger = logging.getLogger(__name__)


class ParsedHolding(TypedDict):
    scheme_name: str
    units: Decimal
    nav: Decimal
    market_value: Decimal
    cost_basis: Decimal | None
    isin: str | None
    asset_type: str | None


class ScreenshotParseResult(TypedDict):
    holdings: list[ParsedHolding]
    total_invested: Decimal
    total_value: Decimal
    as_of_date: str | None


def parse_screenshot_image(
    image_bytes: bytes, mime_type: str, api_key: str | None = None
) -> ScreenshotParseResult:
    """Parse a portfolio/stock dashboard screenshot.

    Uses Gemini 2.5 Flash if api_key is provided, else falls back to mock demo data.
    """
    if api_key:
        try:
            return _parse_with_gemini(image_bytes, mime_type, api_key)
        except Exception as e:
            logger.error("Gemini screenshot parsing failed, falling back to mock: %s", e)

    # Demo Fallback / Mock parser
    return _get_mock_screenshot_data()


def _parse_with_gemini(
    image_bytes: bytes, mime_type: str, api_key: str
) -> ScreenshotParseResult:
    """Call Gemini REST API to extract holdings text/values from image."""
    base64_data = base64.b64encode(image_bytes).decode("utf-8")

    # API Endpoint (Key passed in header x-goog-api-key to avoid URL logging leakage)
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

    prompt = (
        "You are an expert financial OCR assistant. Analyze this screenshot of a "
        "stock or mutual fund investment dashboard (e.g., Zerodha Coin, Kite, Groww, INDmoney) "
        "and extract the active holdings list.\n\n"
        "Extract the following values for each holding and output a raw JSON object matching this schema:\n"
        "{\n"
        "  \"holdings\": [\n"
        "    {\n"
        "      \"scheme_name\": \"Name of Stock or Mutual Fund\",\n"
        "      \"units\": 12.3456,\n"
        "      \"nav\": 120.50, // latest price or NAV per unit\n"
        "      \"cost_basis\": 1500.00, // total invested amount for this holding\n"
        "      \"market_value\": 1750.80, // current market value\n"
        "      \"isin\": \"INE123A01011\", // ISIN if visible, else null\n"
        "      \"asset_type\": \"equity\" // can be 'equity', 'mutual_fund', 'etf', 'bond', or 'other'\n"
        "    }\n"
        "  ],\n"
        "  \"total_value\": 1750.80,\n"
        "  \"total_invested\": 1500.00\n"
        "}\n\n"
        "Important Guidelines:\n"
        "1. Extract as many distinct stocks/mutual funds as are visible.\n"
        "2. Ensure names are exact.\n"
        "3. Units, nav, cost_basis, and market_value MUST be numbers, not strings.\n"
        "4. If cost_basis is missing but average price is shown, calculate cost_basis = average price * units.\n"
        "5. Classify the asset_type correctly. E.g., individual shares should be 'equity', mutual funds 'mutual_fund', ETFs like Bees should be 'etf'.\n"
        "6. Return ONLY raw JSON. No markdown code blocks (e.g. ```json), no wrapping text."
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inlineData": {
                            "mimeType": mime_type,
                            "data": base64_data,
                        }
                    },
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
        },
    }

    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key
    }

    with httpx.Client() as client:
        resp = client.post(url, headers=headers, json=payload, timeout=60)
        resp.raise_for_status()
        resp_json = resp.json()

    text_response = resp_json["candidates"][0]["content"]["parts"][0]["text"].strip()

    # Clean potential markdown wrapping if Gemini ignored constraints
    if text_response.startswith("```"):
        # Remove first line
        lines = text_response.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines[-1].strip() == "```":
            lines = lines[:-1]
        text_response = "\n".join(lines).strip()

    data = json.loads(text_response)

    # Convert numeric fields to Decimal & sanitize
    holdings: list[ParsedHolding] = []
    total_val = Decimal(str(data.get("total_value", 0)))
    total_inv = Decimal(str(data.get("total_invested", 0)))

    for h in data.get("holdings", []):
        holdings.append(
            ParsedHolding(
                scheme_name=h.get("scheme_name", "Unknown Asset"),
                units=Decimal(str(h.get("units", 0))),
                nav=Decimal(str(h.get("nav", 0))),
                market_value=Decimal(str(h.get("market_value", 0))),
                cost_basis=Decimal(str(h.get("cost_basis", 0))) if h.get("cost_basis") else None,
                isin=h.get("isin"),
                asset_type=h.get("asset_type", "equity"),
            )
        )

    return ScreenshotParseResult(
        holdings=holdings,
        total_invested=total_inv,
        total_value=total_val,
        as_of_date=None,
    )


def _get_mock_screenshot_data() -> ScreenshotParseResult:
    """Return realistic mock portfolio holdings for testing/demo scenarios."""
    return ScreenshotParseResult(
        holdings=[
            ParsedHolding(
                scheme_name="Reliance Industries Ltd.",
                units=Decimal("15"),
                nav=Decimal("2845.50"),
                market_value=Decimal("42682.50"),
                cost_basis=Decimal("38200.00"),
                isin="INE002A01018",
                asset_type="equity",
            ),
            ParsedHolding(
                scheme_name="HDFC Bank Limited",
                units=Decimal("25"),
                nav=Decimal("1620.45"),
                market_value=Decimal("40511.25"),
                cost_basis=Decimal("37500.00"),
                isin="INE040A01034",
                asset_type="equity",
            ),
            ParsedHolding(
                scheme_name="Parag Parikh Flexi Cap Fund - Direct Growth",
                units=Decimal("456.842"),
                nav=Decimal("78.45"),
                market_value=Decimal("35839.25"),
                cost_basis=Decimal("28000.00"),
                isin="INF209K01157",
                asset_type="mutual_fund",
            ),
            ParsedHolding(
                scheme_name="Tata Consultancy Services",
                units=Decimal("8"),
                nav=Decimal("3910.15"),
                market_value=Decimal("31281.20"),
                cost_basis=Decimal("29400.00"),
                isin="INE467B01029",
                asset_type="equity",
            ),
        ],
        total_invested=Decimal("133100.00"),
        total_value=Decimal("150314.20"),
        as_of_date=None,
    )
