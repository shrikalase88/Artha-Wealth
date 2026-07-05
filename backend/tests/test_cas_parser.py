import unittest
from unittest.mock import patch, MagicMock
from decimal import Decimal

from casparser.types import (
    CASData,
    NSDLCASData,
    InvestorInfo,
    StatementPeriod,
    Folio,
    Scheme,
    SchemeValuation,
    DematAccount,
    Equity,
    MutualFund,
    Bond,
)
from app.parsers.cas_parser import parse_cas_pdf


class TestCASParser(unittest.TestCase):
    @patch("app.parsers.cas_parser.casparser.read_cas_pdf")
    @patch("app.parsers.cas_parser.pdfplumber.open")
    def test_parse_cas_cams_success(self, mock_pdfplumber_open, mock_read_cas_pdf):
        # 1. Setup mock CASData for CAMS/KFintech
        val = SchemeValuation.model_construct(
            date="2026-07-05",
            nav=Decimal("150.0"),
            cost=Decimal("10000.0"),
            value=Decimal("15075.0"),
        )
        scheme = Scheme.model_construct(
            scheme="HDFC Index Fund",
            isin="INF179K01105",
            close=Decimal("100.5"),
            valuation=val,
        )
        folio = Folio.model_construct(
            folio="123456789",
            PAN="ABCDE1234F",
            schemes=[scheme],
        )
        investor = InvestorInfo.model_construct(name="John Doe")
        period = StatementPeriod.model_construct(**{"to": "2026-07-05", "from": "2026-06-05"})

        cas_data = CASData.model_construct(
            statement_period=period,
            investor_info=investor,
            folios=[folio],
        )
        mock_read_cas_pdf.return_value = cas_data

        # 2. Call parse_cas_pdf
        res = parse_cas_pdf("dummy.pdf")

        # 3. Assertions
        self.assertEqual(res["holder_name"], "John Doe")
        self.assertEqual(res["pan"], "ABCDE1234F")
        self.assertEqual(res["as_of_date"], "2026-07-05")
        self.assertEqual(res["total_value"], Decimal("15075.0"))
        self.assertEqual(res["total_invested"], Decimal("10000.0"))
        self.assertEqual(len(res["holdings"]), 1)

        holding = res["holdings"][0]
        self.assertEqual(holding["folio"], "123456789")
        self.assertEqual(holding["scheme_name"], "HDFC Index Fund")
        self.assertEqual(holding["isin"], "INF179K01105")
        self.assertEqual(holding["units"], Decimal("100.5"))
        self.assertEqual(holding["nav"], Decimal("150.0"))
        self.assertEqual(holding["market_value"], Decimal("15075.0"))
        self.assertEqual(holding["cost_basis"], Decimal("10000.0"))

    @patch("app.parsers.cas_parser.casparser.read_cas_pdf")
    @patch("app.parsers.cas_parser.pdfplumber.open")
    def test_parse_cas_nsdl_success(self, mock_pdfplumber_open, mock_read_cas_pdf):
        # 1. Setup mock NSDLCASData for NSDL/CDSL
        eq = Equity.model_construct(
            name="Reliance Industries",
            isin="INE002A01018",
            num_shares=Decimal("10"),
            price=Decimal("2400.0"),
            value=Decimal("24000.0"),
        )
        mf = MutualFund.model_construct(
            name="SBI Bluechip Fund",
            isin="INF200K01UT1",
            balance=Decimal("500.0"),
            nav=Decimal("60.0"),
            value=Decimal("30000.0"),
            total_cost=Decimal("25000.0"),
            folio="987654321",
        )
        bond = Bond.model_construct(
            name="NHAI Bond",
            isin="INE906B07DF6",
            num_bonds=Decimal("5"),
            market_price=Decimal("1000.0"),
            value=Decimal("5000.0"),
        )

        acct = DematAccount.model_construct(
            name="Demat Account 1",
            equities=[eq],
            mutual_funds=[mf],
            bonds=[bond],
        )
        investor = InvestorInfo.model_construct(name="John Doe")
        period = StatementPeriod.model_construct(**{"to": "2026-07-05", "from": "2026-06-05"})

        nsdl_data = NSDLCASData.model_construct(
            statement_period=period,
            investor_info=investor,
            accounts=[acct],
        )
        mock_read_cas_pdf.return_value = nsdl_data

        # 2. Call parse_cas_pdf
        res = parse_cas_pdf("dummy.pdf")

        # 3. Assertions
        self.assertEqual(res["holder_name"], "John Doe")
        self.assertIsNone(res["pan"])
        self.assertEqual(res["as_of_date"], "2026-07-05")
        self.assertEqual(res["total_value"], Decimal("59000.0"))
        self.assertEqual(res["total_invested"], Decimal("25000.0"))
        self.assertEqual(len(res["holdings"]), 3)

        # Equity
        h_eq = next(h for h in res["holdings"] if h["scheme_name"] == "Reliance Industries")
        self.assertEqual(h_eq["units"], Decimal("10"))
        self.assertEqual(h_eq["nav"], Decimal("2400.0"))
        self.assertEqual(h_eq["market_value"], Decimal("24000.0"))
        self.assertIsNone(h_eq["cost_basis"])

        # Mutual Fund
        h_mf = next(h for h in res["holdings"] if h["scheme_name"] == "SBI Bluechip Fund")
        self.assertEqual(h_mf["units"], Decimal("500"))
        self.assertEqual(h_mf["nav"], Decimal("60.0"))
        self.assertEqual(h_mf["market_value"], Decimal("30000.0"))
        self.assertEqual(h_mf["cost_basis"], Decimal("25000.0"))
        self.assertEqual(h_mf["folio"], "987654321")

        # Bond
        h_bond = next(h for h in res["holdings"] if h["scheme_name"] == "NHAI Bond")
        self.assertEqual(h_bond["units"], Decimal("5"))
        self.assertEqual(h_bond["nav"], Decimal("1000.0"))
        self.assertEqual(h_bond["market_value"], Decimal("5000.0"))
        self.assertIsNone(h_bond["cost_basis"])

    @patch("app.parsers.cas_parser.casparser.read_cas_pdf")
    @patch("app.parsers.cas_parser.pdfplumber.open")
    def test_parse_cas_fallback(self, mock_pdfplumber_open, mock_read_cas_pdf):
        # 1. Setup mock_read_cas_pdf to raise an exception (simulate parsing failure/non-CAS PDF)
        mock_read_cas_pdf.side_effect = Exception("Invalid file format")

        # 2. Setup mock for pdfplumber table extraction
        mock_pdf = MagicMock()
        mock_page = MagicMock()
        mock_pdf.pages = [mock_page]

        # Text extracted from pdf
        mock_page.extract_text.return_value = "Investor: Jane Doe\nPAN: XYZWP5678Q\nStatement as on 01-07-2026"

        # Table extracted from pdf
        mock_page.extract_tables.return_value = [
            [
                ["Scheme Description", "ISIN", "Units", "NAV", "Market Value"],
                ["Axis Long Term Equity Fund", "INF846K01115", "50.0", "70.0", "3500.0"]
            ]
        ]
        mock_pdfplumber_open.return_value.__enter__.return_value = mock_pdf

        # 3. Call parse_cas_pdf
        res = parse_cas_pdf("dummy.pdf")

        # 4. Assertions (Should invoke fallback logic)
        self.assertEqual(res["holder_name"], "Jane Doe")
        self.assertEqual(res["pan"], "XYZWP5678Q")
        self.assertEqual(res["as_of_date"], "01-07-2026")
        self.assertEqual(res["total_value"], Decimal("3500.0"))
        self.assertEqual(len(res["holdings"]), 1)

        holding = res["holdings"][0]
        self.assertEqual(holding["scheme_name"], "Axis Long Term Equity Fund")
        self.assertEqual(holding["units"], Decimal("50.0"))
        self.assertEqual(holding["nav"], Decimal("70.0"))
        self.assertEqual(holding["market_value"], Decimal("3500.0"))

    @patch("app.parsers.cas_parser.casparser.read_cas_pdf")
    @patch("app.parsers.cas_parser.pdfplumber.open")
    def test_parse_cas_spn_investment(self, mock_pdfplumber_open, mock_read_cas_pdf):
        # 1. Setup mock_read_cas_pdf to raise an exception
        mock_read_cas_pdf.side_effect = Exception("Invalid file format")

        # 2. Setup mock for pdfplumber text extraction with SPN format details
        mock_pdf = MagicMock()
        mock_page = MagicMock()
        mock_pdf.pages = [mock_page]

        spn_text = (
            "Page 1 of 4\n"
            "SPN Investment\n"
            "AMFI Regd. Mutual Fund Distributor ARN:74450\n"
            "SHRIKANT SAKHARAM KALASE\n"
            "CMCPK8129A\n"
            "Portfolio Summary\n"
            "Since Inception till 03-07-2026\n"
            "Aditya Birla SL ELSS Tax Saver Fund (ELSS U/S 80C of IT ACT) Reg (G) [1037940836]\n"
            "3,72,000 3,15,003 3,470.6660 690 2,14,834 36,970 1,20,867\n"
            "Bank of India ELSS Tax Saver Fund Reg (G) [9104227685]\n"
            "2,60,000 80,001 1,532.5340 661 2,53,052 39,829 33,224\n"
        )
        mock_page.extract_text.return_value = spn_text
        mock_pdfplumber_open.return_value.__enter__.return_value = mock_pdf

        # 3. Call parse_cas_pdf
        res = parse_cas_pdf("dummy.pdf")

        # 4. Assertions
        self.assertEqual(res["holder_name"], "SHRIKANT SAKHARAM KALASE")
        self.assertEqual(res["pan"], "CMCPK8129A")
        self.assertEqual(res["as_of_date"], "2026-07-03")
        self.assertEqual(len(res["holdings"]), 2)

        # First holding checks
        h1 = next(h for h in res["holdings"] if "Aditya Birla" in h["scheme_name"])
        self.assertEqual(h1["folio"], "1037940836")
        self.assertEqual(h1["units"], Decimal("3470.6660"))
        self.assertEqual(h1["market_value"], Decimal("214834"))
        self.assertEqual(h1["cost_basis"], Decimal("214834") - Decimal("36970"))  # current_value - unrealized_gain

        # Second holding checks
        h2 = next(h for h in res["holdings"] if "Bank of India" in h["scheme_name"])
        self.assertEqual(h2["folio"], "9104227685")
        self.assertEqual(h2["units"], Decimal("1532.5340"))
        self.assertEqual(h2["market_value"], Decimal("253052"))
        self.assertEqual(h2["cost_basis"], Decimal("253052") - Decimal("39829"))

