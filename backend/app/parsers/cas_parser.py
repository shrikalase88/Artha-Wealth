"""Parse Indian CAS (Consolidated Account Statement) PDFs.

Handles the standard CAMS/KFintech format used by all Indian
mutual fund RTA portals. Extracts scheme-level holdings with
folio number, units, NAV, and market value.
"""

import logging
import re
from decimal import Decimal
from typing import TypedDict

import casparser
from casparser.types import CASData, NSDLCASData
import pdfplumber

logger = logging.getLogger(__name__)


class ParsedHolding(TypedDict):
    folio: str
    scheme_name: str
    isin: str | None
    units: Decimal
    nav: Decimal
    market_value: Decimal
    cost_basis: Decimal | None


class CASParseResult(TypedDict):
    holder_name: str | None
    pan: str | None
    holdings: list[ParsedHolding]
    total_invested: Decimal
    total_value: Decimal
    as_of_date: str | None
    raw_text: str


def _clean_number(text: str) -> str:
    return re.sub(r"[,\s\u20b9$€£,]", "", text).strip()


def _decimal(text: str) -> Decimal:
    return Decimal(_clean_number(text) or "0")


def _is_header_row(cells: list[str]) -> bool:
    row = " ".join(cells).lower()
    keywords = [
        "scheme", "isin", "folio", "nav", "unit",
        "market", "value", "total", "grand", "amount",
        "description", "quantity", "price",
    ]
    return any(kw in row for kw in keywords)


def _extract_holdings_from_tables(pdf: pdfplumber.PDF) -> list[ParsedHolding]:
    holdings: list[ParsedHolding] = []
    seen: set[tuple[str, str]] = set()

    for page in pdf.pages:
        text = page.extract_text() or ""
        
        m = re.search(r"Folio\s*No\.?\s*:?\s*(\S+)", text, re.IGNORECASE)
        page_folio = m.group(1).strip() if m else None

        tables = page.extract_tables()
        for table in tables:
            current_scheme: str | None = None
            current_folio: str | None = None
            
            # Default column mapping indices based on standard formats
            col_indices = {
                "units": None,
                "value": None,
                "unrealized_gain": None,
                "cost_basis": None,
            }

            for row in table:
                if not row:
                    continue
                cells = [c.strip() if c else "" for c in row]
                
                # Check if this is a header row
                if _is_header_row(cells):
                    for idx, cell in enumerate(cells):
                        cell_lower = cell.lower()
                        if "unit" in cell_lower or "balance" in cell_lower or "qty" in cell_lower or "quantity" in cell_lower:
                            col_indices["units"] = idx
                        elif "current value" in cell_lower or "market value" in cell_lower or "valuation" in cell_lower or "value" in cell_lower:
                            col_indices["value"] = idx
                        elif "unrealized" in cell_lower:
                            col_indices["unrealized_gain"] = idx
                        elif "cost" in cell_lower or "purchase" in cell_lower or "invested" in cell_lower:
                            col_indices["cost_basis"] = idx
                    continue

                non_empty = [c for c in cells if c]
                if not non_empty:
                    continue
                
                # Case 1: Scheme description row (single cell or name on separate line)
                if len(non_empty) == 1:
                    val = non_empty[0]
                    if re.search(r"[a-zA-Z]", val):
                        # Extract folio inside brackets if present
                        folio_match = re.search(r"\[([0-9/]+)\]", val)
                        if folio_match:
                            current_folio = folio_match.group(1).strip()
                            current_scheme = re.sub(r"\s*\[[0-9/]+\]", "", val).strip()
                        else:
                            current_scheme = val
                    continue

                # Case 2: Numbers row matching previously saved current_scheme
                if current_scheme:
                    numbers = [c for c in cells if re.match(r"^[\d,.-]+$", c) and c]
                    if len(numbers) >= 2:
                        try:
                            idx_units = col_indices["units"] if col_indices["units"] is not None else 2
                            idx_val = col_indices["value"] if col_indices["value"] is not None else (len(cells) - 1)
                            
                            if idx_units < len(cells) and idx_val < len(cells):
                                units = _decimal(cells[idx_units])
                                value = _decimal(cells[idx_val])
                                
                                if units > 0 and value > 0:
                                    nav = round(value / units, 4)
                                    
                                    cost_basis = None
                                    if col_indices["cost_basis"] is not None and col_indices["cost_basis"] < len(cells):
                                        cost_basis = _decimal(cells[col_indices["cost_basis"]])
                                    elif col_indices["unrealized_gain"] is not None and col_indices["unrealized_gain"] < len(cells):
                                        unrealized = _decimal(cells[col_indices["unrealized_gain"]])
                                        cost_basis = value - unrealized
                                        
                                    key = (current_scheme, str(value))
                                    if key not in seen:
                                        seen.add(key)
                                        holdings.append(ParsedHolding(
                                            folio=current_folio or page_folio or "",
                                            scheme_name=current_scheme,
                                            isin=None,
                                            units=units,
                                            nav=nav,
                                            market_value=value,
                                            cost_basis=cost_basis,
                                        ))
                        except Exception as e:
                            logger.warning("Error parsing two-row table format: %s", e)
                        current_scheme = None
                        current_folio = None
                        continue

                # Case 3: Same-row format (scheme description and numbers on the same row)
                if len(cells) >= 3:
                    try:
                        idx_units = col_indices["units"] if col_indices["units"] is not None else (2 if len(cells) >= 5 else 1)
                        idx_val = col_indices["value"] if col_indices["value"] is not None else (4 if len(cells) >= 5 else len(cells) - 1)
                        
                        if idx_units < len(cells) and idx_val < len(cells):
                            units = _decimal(cells[idx_units])
                            value = _decimal(cells[idx_val])
                            if units > 0 and value > 0:
                                scheme_name = cells[0]
                                if re.search(r"[a-zA-Z]", scheme_name):
                                    nav = round(value / units, 4)
                                    
                                    cost_basis = None
                                    if col_indices["cost_basis"] is not None and col_indices["cost_basis"] < len(cells):
                                        cost_basis = _decimal(cells[col_indices["cost_basis"]])
                                    elif col_indices["unrealized_gain"] is not None and col_indices["unrealized_gain"] < len(cells):
                                        unrealized = _decimal(cells[col_indices["unrealized_gain"]])
                                        cost_basis = value - unrealized
                                        
                                    # Extract ISIN if present
                                    isin = None
                                    if len(cells) >= 5 and re.match(r"^[A-Z0-9]{12}$", cells[1]):
                                        isin = cells[1]

                                    key = (scheme_name, str(value))
                                    if key not in seen:
                                        seen.add(key)
                                        holdings.append(ParsedHolding(
                                            folio=page_folio or "",
                                            scheme_name=scheme_name,
                                            isin=isin,
                                            units=units,
                                            nav=nav,
                                            market_value=value,
                                            cost_basis=cost_basis,
                                        ))
                    except Exception:
                        pass

    return holdings


def _extract_holdings_from_text(pdf: pdfplumber.PDF) -> list[ParsedHolding]:
    holdings: list[ParsedHolding] = []
    current_folio: str | None = None
    full_text = ""
    for page in pdf.pages:
        full_text += (page.extract_text() or "") + "\n"

    seen: set[tuple[str, str]] = set()
    for line in full_text.split("\n"):
        line = line.strip()
        if not line:
            continue

        m = re.search(r"Folio\s*No\.?\s*:?\s*(\S+)", line, re.IGNORECASE)
        if m:
            current_folio = m.group(1).strip()

        numbers = re.findall(r"[\d,]+\.\d{2,4}", line)
        if len(numbers) >= 2:
            words = line.split()
            if len(words) >= 4:
                try:
                    value = _decimal(words[-1])
                    nav = _decimal(words[-2])
                    units = _decimal(words[-3])
                    scheme = " ".join(words[:-3])
                    if value > 0 and units > 0:
                        key = (scheme, str(value))
                        if key not in seen:
                            seen.add(key)
                            holdings.append(ParsedHolding(
                                folio=current_folio or "",
                                scheme_name=scheme,
                                isin=None,
                                units=units,
                                nav=nav,
                                market_value=value,
                                cost_basis=None,
                            ))
                except Exception:
                    continue

    return holdings


def _extract_header_info(text: str) -> tuple[str | None, str | None, str | None]:
    name: str | None = None
    pan: str | None = None
    as_of_date: str | None = None

    m = re.search(r"(?:Name|Investor)\s*:?\s*(.+)", text, re.IGNORECASE)
    if m:
        name = m.group(1).strip()

    m = re.search(r"PAN\s*:?\s*([A-Z]{5}[0-9]{4}[A-Z])", text, re.IGNORECASE)
    if m:
        pan = m.group(1).strip()

    m = re.search(
        r"(?:Statement\s*(?:as\s*on|date|period)|as\s*on|as\s*at)\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})",
        text,
        re.IGNORECASE,
    )
    if m:
        as_of_date = m.group(1).strip()

    return name, pan, as_of_date


def _extract_spn_header_info(text: str) -> tuple[str | None, str | None, str | None]:
    from datetime import datetime
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    name = None
    pan = None
    as_of_date = None
    
    for i, line in enumerate(lines):
        m = re.search(r"\b([A-Z]{5}[0-9]{4}[A-Z])\b", line)
        if m:
            pan = m.group(1).strip()
            if i > 0:
                name = lines[i-1].strip()
                if "page" in name.lower() or "investment" in name.lower() or "summary" in name.lower():
                    name = None
                    
        m_date = re.search(r"till\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})", line, re.IGNORECASE)
        if m_date:
            as_of_date = m_date.group(1).strip()
            try:
                dt = datetime.strptime(as_of_date, "%d-%m-%Y")
                as_of_date = dt.strftime("%Y-%m-%d")
            except Exception:
                try:
                    dt = datetime.strptime(as_of_date, "%d/%m/%Y")
                    as_of_date = dt.strftime("%Y-%m-%d")
                except Exception:
                    pass
                    
    return name, pan, as_of_date


def _parse_spn_investment_format(text: str) -> list[ParsedHolding]:
    holdings: list[ParsedHolding] = []
    lines = text.split("\n")
    
    current_scheme = None
    current_folio = None
    seen = set()
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        scheme_match = re.search(r"^(.*?)\s*\[([0-9/]+)\]$", line)
        if scheme_match:
            current_scheme = scheme_match.group(1).strip()
            current_folio = scheme_match.group(2).strip()
            continue
            
        if current_scheme:
            parts = line.split()
            if len(parts) == 7:
                if all(re.match(r"^[\d,.-]+$", p) for p in parts):
                    try:
                        units = _decimal(parts[2])
                        value = _decimal(parts[4])
                        unrealized_gain = _decimal(parts[5])
                        
                        if units > 0 and value > 0:
                            nav = round(value / units, 4)
                            cost_basis = value - unrealized_gain
                            
                            key = (current_scheme, str(value))
                            if key not in seen:
                                seen.add(key)
                                holdings.append(ParsedHolding(
                                    folio=current_folio or "",
                                    scheme_name=current_scheme,
                                    isin=None,
                                    units=units,
                                    nav=nav,
                                    market_value=value,
                                    cost_basis=cost_basis,
                                ))
                    except Exception as e:
                        logger.warning("Error parsing numbers line in SPN format: %s", e)
                    current_scheme = None
                    current_folio = None
                    
    return holdings


def parse_cas_pdf(file_path: str) -> CASParseResult:
    """Parse a CAS PDF and return structured holdings."""
    try:
        data = casparser.read_cas_pdf(file_path, password="")
        holdings: list[ParsedHolding] = []
        name = None
        pan = None
        as_of_date = None

        if data.investor_info:
            name = data.investor_info.name

        if data.statement_period:
            as_of_date = data.statement_period.to

        if isinstance(data, CASData):
            for folio in data.folios:
                if folio.PAN and folio.PAN.strip() and folio.PAN.strip().upper() != "OK":
                    if not pan:
                        pan = folio.PAN.strip()
                for scheme in folio.schemes:
                    holdings.append(ParsedHolding(
                        folio=folio.folio or "",
                        scheme_name=scheme.scheme,
                        isin=scheme.isin or None,
                        units=scheme.close,
                        nav=scheme.valuation.nav,
                        market_value=scheme.valuation.value,
                        cost_basis=scheme.valuation.cost,
                    ))
        elif isinstance(data, NSDLCASData):
            for account in data.accounts:
                for equity in account.equities:
                    holdings.append(ParsedHolding(
                        folio="",
                        scheme_name=equity.name,
                        isin=equity.isin or None,
                        units=equity.num_shares,
                        nav=equity.price,
                        market_value=equity.value,
                        cost_basis=None,
                    ))
                for mf in account.mutual_funds:
                    cost_basis = mf.total_cost
                    if cost_basis is None and mf.avg_cost is not None and mf.balance is not None:
                        cost_basis = mf.avg_cost * mf.balance
                    holdings.append(ParsedHolding(
                        folio=mf.folio or "",
                        scheme_name=mf.name,
                        isin=mf.isin or None,
                        units=mf.balance,
                        nav=mf.nav,
                        market_value=mf.value,
                        cost_basis=cost_basis,
                    ))
                for bond in account.bonds:
                    holdings.append(ParsedHolding(
                        folio="",
                        scheme_name=bond.name,
                        isin=bond.isin or None,
                        units=bond.num_bonds,
                        nav=bond.market_price,
                        market_value=bond.value,
                        cost_basis=None,
                    ))

        total_value = sum(h["market_value"] for h in holdings)
        total_invested = sum(h["cost_basis"] for h in holdings if h["cost_basis"] is not None)

        raw_text_excerpt = ""
        try:
            with pdfplumber.open(file_path) as pdf:
                raw_text_excerpt = "\n".join((page.extract_text() or "") for page in pdf.pages)[:2000]
        except Exception:
            pass

        # Fallback regex extraction for PAN/Name if missing
        if not pan or not name or not as_of_date:
            try:
                if not raw_text_excerpt:
                    with pdfplumber.open(file_path) as pdf:
                        raw_text_excerpt = "\n".join((page.extract_text() or "") for page in pdf.pages)
                ext_name, ext_pan, ext_as_of_date = _extract_header_info(raw_text_excerpt)
                if not name:
                    name = ext_name
                if not pan:
                    pan = ext_pan
                if not as_of_date:
                    as_of_date = ext_as_of_date
            except Exception:
                pass

        return CASParseResult(
            holder_name=name,
            pan=pan,
            holdings=holdings,
            total_invested=total_invested,
            total_value=total_value,
            as_of_date=as_of_date,
            raw_text=raw_text_excerpt[:2000],
        )

    except Exception as e:
        logger.warning("casparser failed to parse CAS PDF, falling back to pdfplumber: %s", e)
        with pdfplumber.open(file_path) as pdf:
            full_text = "\n".join((page.extract_text() or "") for page in pdf.pages)
            
            if "SPN Investment" in full_text:
                name, pan, as_of_date = _extract_spn_header_info(full_text)
                holdings = _parse_spn_investment_format(full_text)
            else:
                name, pan, as_of_date = _extract_header_info(full_text)
                holdings = _extract_holdings_from_tables(pdf)
                if not holdings:
                    holdings = _extract_holdings_from_text(pdf)

            total_value = sum(h["market_value"] for h in holdings)
            total_invested = sum(h["cost_basis"] for h in holdings if h["cost_basis"] is not None)

        return CASParseResult(
            holder_name=name,
            pan=pan,
            holdings=holdings,
            total_invested=total_invested,
            total_value=total_value,
            as_of_date=as_of_date,
            raw_text=full_text[:2000],
        )
