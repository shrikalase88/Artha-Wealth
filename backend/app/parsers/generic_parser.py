"""Generic portfolio PDF parser — handles broker summaries, bank statements, etc.

Tries multiple strategies in order:
  1. Smart table extraction via pdfplumber (column header matching)
  2. Line-by-line number/pattern matching
  3. Simple word-boundary number detection
"""

import re
from decimal import Decimal
from typing import TypedDict

import pdfplumber


class ParsedHolding(TypedDict):
    folio: str
    scheme_name: str
    isin: str | None
    units: Decimal
    nav: Decimal
    market_value: Decimal
    cost_basis: Decimal | None


class ParseResult(TypedDict):
    holder_name: str | None
    pan: str | None
    vendor: str | None
    holdings: list[ParsedHolding]
    total_invested: Decimal
    total_value: Decimal
    as_of_date: str | None
    raw_text: str


def _clean(text: str) -> str:
    return re.sub(r"[,\s\u20b9$€£,]", "", text).strip()


def _dec(text: str) -> Decimal:
    try:
        return Decimal(_clean(text) or "0")
    except Exception:
        return Decimal("0")


# Column-label patterns for identifying table structure
_NAME_KEYS = re.compile(
    r"scheme|fund|security|instrument|script|scrip|stock|name|description|holding|symbol",
    re.IGNORECASE,
)
_QTY_KEYS = re.compile(r"unit|quantity|qty|shares|nos(?:\.|\b)|balance\s*units?", re.IGNORECASE)
_COST_KEYS = re.compile(
    r"cost\s*basis|total\s*cost|cost\s*value|invested|investment|buy\s*value|purchase\s*value|purchase\s*cost",
    re.IGNORECASE,
)
_AVG_PRICE_KEYS = re.compile(
    r"avg(?:\.|\s*)?(?:cost|price|buy|rate)|buy\s*(?:price|rate)|purchase\s*price|average",
    re.IGNORECASE,
)
_NAV_KEYS = re.compile(r"nav|ltp|cmp|market\s*price|closing\s*price|last\s*price|rate|price", re.IGNORECASE)
_VAL_KEYS = re.compile(
    r"market\s*value|current\s*value|valuation|curr(?:\.|\s*)?val|total\s*value|amount|value",
    re.IGNORECASE,
)
_ISIN_KEYS = re.compile(r"^isin$|isin\s*code", re.IGNORECASE)
_FOLIO_KEYS = re.compile(r"folio", re.IGNORECASE)


def _classify_header(cells: list[str]) -> dict[str, int]:
    """Map column names to indices with priority."""
    mapping: dict[str, int] = {}
    for i, raw_c in enumerate(cells):
        c = raw_c.strip().lower()
        if not c:
            continue
        if _ISIN_KEYS.search(c) and "isin" not in mapping:
            mapping["isin"] = i
        elif _FOLIO_KEYS.search(c) and "folio" not in mapping:
            mapping["folio"] = i
        elif _COST_KEYS.search(c) and "cost" not in mapping:
            mapping["cost"] = i
        elif _AVG_PRICE_KEYS.search(c) and "avg_price" not in mapping:
            mapping["avg_price"] = i
        elif _VAL_KEYS.search(c) and "val" not in mapping:
            mapping["val"] = i
        elif _NAV_KEYS.search(c) and "nav" not in mapping:
            mapping["nav"] = i
        elif _QTY_KEYS.search(c) and "qty" not in mapping:
            mapping["qty"] = i
        elif _NAME_KEYS.search(c) and "name" not in mapping:
            mapping["name"] = i
    return mapping


def _try_extract_tables(pdf: pdfplumber.PDF) -> list[ParsedHolding]:
    """Extract holdings using pdfplumber table detection + header matching."""
    holdings: list[ParsedHolding] = []
    seen: set[tuple[str, str]] = set()

    for page in pdf.pages:
        for table in page.extract_tables():
            if not table or len(table) < 2:
                continue

            header_cells = [c.strip() if c else "" for c in table[0]]
            col_map = _classify_header(header_cells)

            needs = {"name", "val"}
            if not needs.issubset(col_map.keys()):
                continue

            for row in table[1:]:
                if not row or len(row) < max(col_map.values()) + 1:
                    continue

                cells = [c.strip() if c else "" for c in row]

                name = cells[col_map["name"]]
                if not name or _is_noise(name):
                    continue

                val = _dec(cells[col_map["val"]])
                if val <= 0:
                    continue

                qty = (
                    _dec(cells[col_map["qty"]])
                    if "qty" in col_map and cells[col_map["qty"]]
                    else Decimal("0")
                )
                nav = (
                    _dec(cells[col_map["nav"]])
                    if "nav" in col_map and cells[col_map["nav"]]
                    else Decimal("0")
                )
                isin = (
                    cells[col_map["isin"]].strip().upper()
                    if "isin" in col_map
                    and re.match(r"^[A-Z0-9]{12}$", cells[col_map["isin"]].strip().upper())
                    else ""
                )

                cost_basis: Decimal | None = None
                if "cost" in col_map and cells[col_map["cost"]]:
                    cb = _dec(cells[col_map["cost"]])
                    if cb > 0:
                        cost_basis = cb
                elif "avg_price" in col_map and cells[col_map["avg_price"]]:
                    avg_p = _dec(cells[col_map["avg_price"]])
                    if avg_p > 0 and qty > 0:
                        cost_basis = qty * avg_p

                key = (name, str(val))
                if key in seen:
                    continue
                seen.add(key)

                holdings.append(ParsedHolding(
                    folio="",
                    scheme_name=name,
                    isin=isin or None,
                    units=qty if qty > 0 else (val / nav if nav > 0 else Decimal("1")),
                    nav=nav if nav > 0 else (val / qty if qty > 0 else val),
                    market_value=val,
                    cost_basis=cost_basis,
                ))

    return holdings


def _is_noise(text: str) -> bool:
    t = text.strip().lower()
    if not t or len(t) < 3:
        return True
    noise = {
        "total", "grand total", "sub total", "folio", "page", "date",
        "particulars", "description", "summary", "statement", "balance",
        "opening", "closing", "brought forward", "carried forward",
    }
    return t in noise


def _try_extract_by_lines(pdf: pdfplumber.PDF) -> list[ParsedHolding]:
    """Line-by-line extraction: look for lines with numbers that look like holdings."""
    holdings: list[ParsedHolding] = []
    seen: set[tuple[str, str]] = set()
    full_text = "\n".join((page.extract_text() or "") for page in pdf.pages)

    for line in full_text.split("\n"):
        line = line.strip()
        if not line or len(line) < 10 or _is_noise(line):
            continue

        numbers = re.findall(r"[\d,]+\.\d{2,6}", line)
        if len(numbers) < 2:
            continue

        try:
            decs = [_dec(n) for n in numbers]
            candidates = [(i, d) for i, d in enumerate(decs) if d > 0]
            if len(candidates) < 2:
                continue

            value = max(candidates, key=lambda x: x[1])[1]

            non_val = [(i, d) for i, d in candidates if d != value]
            nav = max(non_val, key=lambda x: x[1])[1] if non_val else decs[0]
            qty_candidates = [d for d in decs if d > 0 and d != value and d != nav]
            qty = max(qty_candidates) if qty_candidates else value / nav if nav > 0 else Decimal("1")

            words = re.split(r"\s{2,}", line)
            if len(words) < 2:
                words = line.split()
                if len(words) < 2:
                    continue

            name_words = [w for w in words if not re.match(r"^[\d,()./%]+$", w.strip())]
            if not name_words:
                continue

            scheme = " ".join(name_words).strip()
            if len(scheme) < 3 or _is_noise(scheme):
                continue

            key = (scheme, str(value))
            if key in seen:
                continue
            seen.add(key)

            holdings.append(ParsedHolding(
                folio="",
                scheme_name=scheme,
                isin=None,
                units=qty if qty > 0 else value / nav if nav > 0 else Decimal("1"),
                nav=nav,
                market_value=value,
                cost_basis=None,
            ))
        except Exception:
            continue

    return holdings


def _detect_vendor(text: str) -> str | None:
    t = text.lower()
    vendors = [
        ("zerodha", "Zerodha"),
        ("groww", "Groww"),
        ("cams", "CAMS"),
        ("kfintech", "KFintech"),
        ("karvy", "KFintech"),
        ("cdsl", "CDSL"),
        ("nsdl", "NSDL"),
        ("icici direct", "ICICI Direct"),
        ("hdfc sky", "HDFC Sky"),
        ("hdfc securities", "HDFC Securities"),
        ("upstox", "Upstox"),
        ("angel one", "Angel One"),
        ("angel broking", "Angel One"),
        ("motilal oswal", "Motilal Oswal"),
        ("paytm money", "Paytm Money"),
        ("indmoney", "INDmoney"),
        ("kotak securities", "Kotak Securities"),
        ("axis direct", "Axis Direct"),
        ("sharekhan", "Sharekhan"),
        ("dhan", "Dhan"),
        ("5paisa", "5paisa"),
    ]
    for key, name in vendors:
        if key in t:
            return name
    return None


def _extract_header_info(text: str) -> tuple[str | None, str | None, str | None, str | None]:
    name: str | None = None
    pan: str | None = None
    as_of_date: str | None = None
    vendor = _detect_vendor(text)

    m = re.search(r"(?:Name|Investor|Client)\s*:?\s*(.+)", text, re.IGNORECASE)
    if m:
        name = m.group(1).strip()

    m = re.search(r"PAN\s*:?\s*([A-Z]{5}[0-9]{4}[A-Z])", text, re.IGNORECASE)
    if m:
        pan = m.group(1).strip()

    m = re.search(
        r"(?:Statement\s*(?:as\s*on|date|period)|as\s*on|as\s*at|as\s*of)\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})",
        text,
        re.IGNORECASE,
    )
    if m:
        as_of_date = m.group(1).strip()

    return name, pan, as_of_date, vendor


def parse_generic_pdf(file_path: str) -> ParseResult:
    """Parse any portfolio PDF — tries table extraction first, then line-by-line."""
    with pdfplumber.open(file_path) as pdf:
        full_text = "\n".join((page.extract_text() or "") for page in pdf.pages)
        name, pan, as_of_date, vendor = _extract_header_info(full_text)

        holdings = _try_extract_tables(pdf)
        if not holdings:
            holdings = _try_extract_by_lines(pdf)

        total_value = sum(h["market_value"] for h in holdings)
        total_invested = sum(h["cost_basis"] for h in holdings if h.get("cost_basis") is not None)

    return ParseResult(
        holder_name=name,
        pan=pan,
        vendor=vendor,
        holdings=holdings,
        total_invested=total_invested,
        total_value=total_value,
        as_of_date=as_of_date,
        raw_text=full_text[:2000],
    )
