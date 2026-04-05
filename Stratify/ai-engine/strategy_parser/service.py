"""Strategy parser implementation with deterministic fallback."""

import re
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
import uuid
import json

from utils.config import get_config
from utils.gemini_client import call_gemini

logger = logging.getLogger(__name__)
config = get_config()

# ---------------------------------------------------------------------------
# Safe import of GeneratedRule — falls back to a local dataclass if the
# models module cannot be resolved (e.g. Pyre / standalone execution).
# ---------------------------------------------------------------------------
try:
    from .models import GeneratedRule  # type: ignore[import]
except (ImportError, ModuleNotFoundError):
    try:
        from models import GeneratedRule  # type: ignore[import]
    except (ImportError, ModuleNotFoundError):
        @dataclass
        class GeneratedRule:  # type: ignore[no-redef]
            """Fallback dataclass used when models module is unavailable."""
            indicator: str
            operator: str
            value: float
            action: str
            logic: str = "ENTRY"
            confidence: float = 0.85
            metadata: Dict[str, Any] = field(default_factory=dict)


class StrategyParser:
    """
    Deterministic strategy parser for natural language trading rules.

    Handles common trading phrases and generates structured rules.
    Designed to be modular so NLP models can be injected later.
    """

    # Supported indicators only: RSI, MACD, SMA, BollingerBand, Stochastic
    INDICATORS = {
        r"\bRSI\b": "RSI",
        r"\bMACD\b": "MACD",
        r"\bSMA\b": "SMA",
        r"\bBB\b|bolling": "BollingerBand",
        r"\bstochastic\b": "Stochastic",
    }

    OPERATORS = {
        r"<": "<",
        r">": ">",
        r"<=": "<=",
        r">=": ">=",
        r"==|=": "==",
        r"!=": "!=",
    }

    ACTIONS = {
        r"\bbuy\b": "BUY",
        r"\bsell\b": "SELL",
        r"\bhold\b": "HOLD",
        r"\bgo long\b": "BUY",
        r"\bgo short\b": "SELL",
        r"\benter\b": "BUY",
        r"\bexit\b": "SELL",
    }

    def __init__(self) -> None:
        """Initialize parser with default backend."""
        self.backend = None  # TODO: replace stub with real NLP model

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def parse(
        self,
        language_input: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Parse natural language strategy input into a structured spec.

        Args:
            language_input: Natural language strategy description.
            context: Optional dict with symbol, timeframe, initial_capital.

        Returns:
            Strategy spec dictionary produced by Gemini.
        """
        if not language_input or not isinstance(language_input, str):
            raise ValueError("language_input must be a non-empty string")

        context = context or {}
        return self._parse_with_gemini(language_input, context)

    # ------------------------------------------------------------------
    # Gemini parsing
    # ------------------------------------------------------------------

    def _parse_with_gemini(
        self, language_input: str, context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Ask Gemini to produce a compact strategy spec JSON.

        generated_rules example:
            {
                "pair": "EURUSD",
                "indicator": "MACD",
                "buy": "macd > signal",
                "sell": "macd < signal",
                "stop_loss": 0.02,
                "take_profit": 0.05,
                "timeframe": "1h"
            }
        """
        model: str = getattr(config, "GENAI_MODEL", "gemini-2.0-flash")

        prompt = (
            """You are a STRICT, HIGH-PRECISION Forex Trading Strategy Parser.

Your ONLY job:
→ Take a natural-language forex trading strategy description,
→ Extract trading information if present,
→ Produce EXACTLY ONE JSON OBJECT strictly matching the schema below,
→ NO extra text, NO markdown, NO commentary.

=====================================================
CRITICAL BEHAVIOR RULES
=====================================================
1. If the user input is NOT RELATED to forex trading, you MUST treat it
   as NON-TRADING input → fill ALL fields with null except:
      "description": "Non-trading input rejected"

2. VALID trading-related inputs MUST include ALL of the following:
   a) At least one SUPPORTED INDICATOR: RSI, MACD, SMA, Bollinger Bands (BB), Stochastic
   b) At least one ACTIONABLE VERB: buy, sell, enter, exit, long, short
   c) A FOREX PAIR (e.g. EURUSD, GBPUSD, USDJPY, XAUUSD, AUDUSD, NZDUSD, USDCHF, USDCAD)
   d) An INITIAL CAPITAL amount (e.g. 1000, 5000, 10000)

3. REJECTION RULES — REJECT if ANY of the following are true:
   - Input is an emotional statement ("I love EURUSD")
   - Input is casual market commentary ("EURUSD looks bullish today")
   - Input is a greeting ("Hello", "Hi", "What's up")
   - Input is a prediction WITHOUT a rule ("GBPUSD will go up tomorrow")
   - Input only mentions a symbol with NO strategy logic
   - Input is missing the FOREX PAIR → REJECT with warning
   - Input is missing the INITIAL CAPITAL → REJECT with warning
   - Input uses NON-FOREX instruments (stocks, crypto like BTC/ETH, indices like SPX)
   - Input uses unsupported indicators (EMA, ATR, VWAP, etc.)

4. SUPPORTED INDICATORS & COMBINATIONS:
   - Supported: RSI, MACD, SMA, BollingerBand (BB), Stochastic
   - For COMBINATIONS (e.g., RSI and MACD):
     → Set `indicator` to a join of names with underscores: `rsi_macd`, `sma_rsi_stochastic`, etc.
     → In `buy`/`sell`, use clear signals like `rsi < 30 and macd > 0`.

5. SUPPORTED FOREX PAIRS ONLY:
   - Major pairs: EURUSD, GBPUSD, USDJPY, USDCHF, USDCAD, AUDUSD, NZDUSD
   - Gold: XAUUSD
   - Cross pairs: EURGBP, EURJPY, GBPJPY, AUDCAD, etc.
   - Any standard forex pair in format XXXYYY (6 letters, no slash)

6. If a field like `stop_loss` or `take_profit` is not explicitly stated → return null or a reasonable default (0.02 / 0.05) if the user implies a standard strategy.

7. The field `language_input` MUST always contain EXACTLY the original input unchanged.

8. Always return ONE CLEAN JSON object — no backticks, no explanation, no markdown.

=====================================================
OUTPUT JSON SCHEMA
=====================================================
{
  "owner_id": string or null,
  "name": string or null,
  "description": string or null,
  "language_input": string,
  "generated_rules": {
      "pair": string,
      "indicator": string,  // e.g. "rsi", "macd", or "rsi_macd" for combinations
      "buy": string,       // e.g. "rsi < 30" or "rsi < 30 and macd > 0"
      "sell": string,      // e.g. "rsi > 70" or "rsi > 70 and macd < 0"
      "stop_loss": number or null,
      "take_profit": number or null
  },
  "initial_capital": number,
  "engine_type": "BACKTEST",
  "visibility": "PUBLIC",
  "warnings": []
}

=====================================================
STRICT JSON RULES
=====================================================
- STRING fields: exact words from input, lowercase allowed.
- NUMBERS: float, not string.
- No comments, no trailing commas.
- If unsure about a value → provide a safe default or null.

=====================================================
DECISION LOGIC
=====================================================

IF input is NON-TRADING or missing required fields → return:
{
  "owner_id": null,
  "name": null,
  "description": "Non-trading input rejected",
  "language_input": "<exact input>",
  "generated_rules": {
    "pair": null,
    "indicator": null,
    "buy": null,
    "sell": null,
    "stop_loss": null,
    "take_profit": null
  },
  "initial_capital": null,
  "engine_type": null,
  "visibility": null,
  "warnings": ["<reason for rejection>"]
}

=====================================================
EXAMPLES
=====================================================

Example 1 — VALID INPUT
Input: "Buy EURUSD on 1h timeframe when RSI < 30 and sell when RSI > 70. Stop loss 0.02, take profit 0.05. Initial capital 10000."
Output:
{
  "owner_id": null,
  "name": "RSI Strategy",
  "description": "Forex RSI strategy on EURUSD 1h",
  "language_input": "Buy EURUSD on 1h timeframe when RSI < 30 and sell when RSI > 70. Stop loss 0.02, take profit 0.05. Initial capital 10000.",
  "generated_rules": {
    "pair": "EURUSD",
    "indicator": "RSI",
    "buy": "rsi < 30",
    "sell": "rsi > 70",
    "stop_loss": 0.02,
    "take_profit": 0.05
  },
  "initial_capital": 10000,
  "engine_type": null,
  "visibility": null,
  "warnings": []
}

Example 2 — MISSING PAIR → REJECT
Input: "Buy when RSI < 30 on 4h chart. Capital 2000."
Output:
{
  "owner_id": null,
  "name": null,
  "description": "Non-trading input rejected",
  "language_input": "Buy when RSI < 30 on 4h chart. Capital 2000.",
  "generated_rules": {
    "pair": null, "indicator": null, "buy": null, "sell": null,
    "stop_loss": null, "take_profit": null
  },
  "initial_capital": null,
  "engine_type": null,
  "visibility": null,
  "warnings": ["Forex pair not specified in input"]
}

Example 4 — MISSING CAPITAL → REJECT
Input: "Buy GBPUSD on 15m when Stochastic < 20."
Output:
{
  "owner_id": null,
  "name": null,
  "description": "Non-trading input rejected",
  "language_input": "Buy GBPUSD on 15m when Stochastic < 20.",
  "generated_rules": {
    "pair": null, "indicator": null, "buy": null, "sell": null,
    "stop_loss": null, "take_profit": null
  },
  "initial_capital": null,
  "engine_type": null,
  "visibility": null,
  "warnings": ["Initial capital not specified in input"]
}

Example 5 — NON-FOREX INSTRUMENT → REJECT
Input: "Buy BTCUSDT when RSI < 30 on 1h. Capital 1000."
Output:
{
  "owner_id": null,
  "name": null,
  "description": "Non-trading input rejected",
  "language_input": "Buy BTCUSDT when RSI < 30 on 1h. Capital 1000.",
  "generated_rules": {
    "pair": null, "indicator": null, "buy": null, "sell": null,
    "stop_loss": null, "take_profit": null
  },
  "initial_capital": null,
  "engine_type": null,
  "visibility": null,
  "warnings": ["Only forex pairs are supported. Crypto/stock instruments are not accepted."]
}

Example 6 — TRIPLE INDICATOR COMBINATION
Input: "Buy EURUSD on 1h if RSI < 30, MACD > 0, and price is above SMA 200. Capital 10000."
Output:
{
  "owner_id": null,
  "name": "Triple Indicator Strategy",
  "description": "Composite RSI-MACD-SMA strategy",
  "language_input": "Buy EURUSD on 1h if RSI < 30, MACD > 0, and price is above SMA 200. Capital 10000.",
  "generated_rules": {
    "pair": "EURUSD",
    "indicator": "rsi_macd_sma",
    "buy": "rsi < 30 and macd > 0 and close > sma",
    "sell": "rsi > 70 or macd < 0 or close < sma",
    "stop_loss": 0.02,
    "take_profit": 0.05
  },
  "initial_capital": 10000,
  "engine_type": "BACKTEST",
  "visibility": "PUBLIC",
  "warnings": []
}

Example 7 — UNSUPPORTED INDICATOR → REJECT
Input: "Buy EURUSD when EMA 50 crosses EMA 200 on 4h. Capital 3000."
Output:
{
  "owner_id": null,
  "name": null,
  "description": "Non-trading input rejected",
  "language_input": "Buy EURUSD when EMA 50 crosses EMA 200 on 4h. Capital 3000.",
  "generated_rules": {
    "pair": null, "indicator": null, "buy": null, "sell": null,
    "stop_loss": null, "take_profit": null
  },
  "initial_capital": null,
  "engine_type": null,
  "visibility": null,
  "warnings": ["Unsupported indicator used. Only RSI, MACD, SMA, BollingerBand, Stochastic are supported."]
}

=====================================================
REJECT EXAMPLES (NON-TRADING)
=====================================================
"I love EURUSD" → REJECT
"GBPUSD is going up" → REJECT
"Hello" → REJECT
"Tell me about RSI" → REJECT
"BTC will pump" → REJECT

=====================================================
NOW PARSE THE FOLLOWING INPUT:
=====================================================
"""
        )

        messages = [
            {
                "role": "user",
                "content": (
                    prompt
                    + "\n\nContext:\n"
                    + json.dumps(context)
                    + "\n\nText:\n"
                    + language_input
                ),
            }
        ]

        resp = call_gemini(model, messages)
        if resp.get("error"):
            raise RuntimeError(f"Gemini API error: {resp['error']}")

        parsed = resp.get("json")
        text: str = resp.get("text", "")

        # Attempt to extract JSON from raw text if not already parsed
        if parsed is None:
            try:
                start = text.find("{")
                end = text.rfind("}")
                if start != -1 and end != -1:
                    parsed = json.loads(text[start : end + 1])
            except Exception:
                parsed = None

        if not isinstance(parsed, dict):
            parsed = {}

        # Prepare spec
        spec: Dict[str, Any] = {
            "owner_id": parsed.get("owner_id"),
            "name": parsed.get("name"),
            "description": parsed.get("description"),
            "language_input": parsed.get("language_input") or language_input,
            "generated_rules": parsed.get("generated_rules") or {},
            "initial_capital": parsed.get("initial_capital") or context.get("initial_capital"),
            "engine_type": parsed.get("engine_type"),
            "visibility": parsed.get("visibility"),
            "warnings": parsed.get("warnings") or [],
        }

        # Post-process: ensure indicators are not null if found in strings
        gr = spec["generated_rules"]
        if gr and not gr.get("indicator"):
            found = []
            buy_val = (gr.get("buy") or "").lower()
            sell_val = (gr.get("sell") or "").lower()
            orig = language_input.lower()
            for pattern, name in self.INDICATORS.items():
                if name.lower() in buy_val or name.lower() in sell_val or name.lower() in orig:
                    if name not in found:
                        found.append(name.lower())
            if found:
                gr["indicator"] = "_".join(found)

        return spec

    # ------------------------------------------------------------------
    # Helper methods (used by fallback / unit tests)
    # ------------------------------------------------------------------

    def _parse_sentence(
        self,
        sentence: str,
        context: Dict[str, Any],
    ) -> Optional[GeneratedRule]:
        """
        Parse a single sentence into a GeneratedRule.

        Examples:
            "Buy EURUSD when RSI < 30" → GeneratedRule
            "Sell when MACD > 0"       → GeneratedRule
        """
        sentence_lower = sentence.lower()

        action = self._extract_action(sentence_lower)
        if not action:
            return None

        indicator, operator, value = self._extract_condition(sentence_lower)
        if not indicator or not operator or value is None:
            return None

        logic = self._determine_logic(sentence_lower)

        return GeneratedRule(
            indicator=indicator,
            operator=operator,
            value=float(value),
            action=action,
            logic=logic,
            confidence=0.85,
        )

    def _extract_action(self, sentence: str) -> Optional[str]:
        """Extract trading action (BUY / SELL / HOLD) from sentence."""
        for pattern, action in self.ACTIONS.items():
            if re.search(pattern, sentence, re.IGNORECASE):
                return action
        return None

    def _extract_condition(
        self,
        sentence: str,
    ) -> "tuple[Optional[str], Optional[str], Optional[float]]":
        """
        Extract (indicator, operator, value) from sentence.

        Returns (None, None, None) when extraction fails.
        """
        indicator: Optional[str] = None
        for pattern, ind_name in self.INDICATORS.items():
            if re.search(pattern, sentence, re.IGNORECASE):
                indicator = ind_name
                break

        if not indicator:
            return None, None, None

        # Match multi-char operators first (>=, <=, ==, !=) then < >
        op_pattern = r"(<=|>=|==|!=|<|>)\s*(\d+(?:\.\d+)?)"
        match = re.search(op_pattern, sentence)
        if not match:
            return indicator, None, None

        return indicator, match.group(1), float(match.group(2))

    def _extract_symbol(
        self, sentence: str, default_symbol: Optional[str]
    ) -> str:
        """Extract a 6-letter forex pair from sentence (e.g. EURUSD)."""
        matches = re.findall(r"\b([A-Z]{6})\b", sentence)
        return matches[0] if matches else (default_symbol or "")

    def _determine_logic(self, sentence: str) -> str:
        """Determine rule logic type: ENTRY, EXIT, or FILTER."""
        if re.search(r"\b(exit|close|sell)\b", sentence):
            return "EXIT"
        if re.search(r"\b(filter|condition)\b", sentence):
            return "FILTER"
        return "ENTRY"

    def _fallback_parse(
        self,
        language_input: str,
        context: Dict[str, Any],
    ) -> List[GeneratedRule]:
        """
        Regex fallback when Gemini is unavailable.

        Supports only: RSI, MACD, SMA, BollingerBand, Stochastic.
        """
        rules: List[GeneratedRule] = []
        language_lower = language_input.lower()

        if "buy" in language_lower or "sell" in language_lower:
            action = "BUY" if "buy" in language_lower else "SELL"

            for ind_pattern, indicator in self.INDICATORS.items():
                if re.search(ind_pattern, language_input, re.IGNORECASE):
                    match = re.search(
                        r"(<=|>=|==|!=|<|>)\s*(\d+(?:\.\d+)?)", language_input
                    )
                    if match:
                        rules.append(
                            GeneratedRule(
                                indicator=indicator,
                                operator=match.group(1),
                                value=float(match.group(2)),
                                action=action,
                                logic="ENTRY",
                                confidence=0.70,
                            )
                        )
                        break

        return rules


# ---------------------------------------------------------------------------
# Code generation (deterministic, no I/O)
# ---------------------------------------------------------------------------

def generate_python_code(rules: Any, include_comments: bool = True) -> str:
    """
    Generate safe Python strategy function code from validated rules.

    Args:
        rules: List of GeneratedRule objects or plain dicts.
        include_comments: Whether to include inline comments.

    Returns:
        Python source code string.
    """
    lines: List[str] = []

    if include_comments:
        lines += [
            "# Auto-generated strategy function",
            "# Generated by Stratify AI Engine",
            "",
        ]

    lines += [
        "def strategy(data):",
        '    """',
        "    Execute strategy based on generated rules.",
        "    ",
        "    Args:",
        "        data: Dictionary with OHLCV data and indicators.",
        "    ",
        "    Returns:",
        "        Dict with 'action' (BUY/SELL/HOLD) and optional metadata.",
        '    """',
        '    signal = "HOLD"',
        "",
    ]

    # Normalise rules to plain dicts
    normalized: List[Dict[str, Any]] = []
    for r in rules:
        if isinstance(r, dict):
            normalized.append(r)
        else:
            normalized.append(
                {
                    "indicator": getattr(r, "indicator", None),
                    "operator": getattr(r, "operator", None),
                    "value": getattr(r, "value", None),
                    "action": getattr(r, "action", None),
                    "logic": getattr(r, "logic", "ENTRY"),
                }
            )

    entry_rules = [r for r in normalized if (r.get("logic") or "ENTRY") == "ENTRY"]
    exit_rules  = [r for r in normalized if (r.get("logic") or "ENTRY") == "EXIT"]

    def _emit_rules(rule_list: List[Dict[str, Any]], label: str) -> None:
        if not rule_list:
            return
        if include_comments:
            lines.append(f"    # {label}")
        for i, rule in enumerate(rule_list):
            ind = rule.get("indicator")
            op  = rule.get("operator")
            val = rule.get("value")
            act = rule.get("action")
            
            # If indicator is missing, try to infer from buy/sell strings
            if not ind:
                buy_str = rule.get("buy", "").lower()
                sell_str = rule.get("sell", "").lower()
                for pattern, name in {"rsi": "rsi", "macd": "macd", "sma": "sma", "bb": "bollingerband", "stochastic": "stochastic"}.items():
                    if pattern in buy_str or pattern in sell_str:
                        ind = name
                        break
            
            indicator_var = (ind or "close").lower()
            lines.append(f"    # Rule {i + 1}: {ind} {op} {val}")
            lines.append(f"    if data.get('{indicator_var}') {op} {val}:")
            lines.append(f'        signal = "{act}"')
        lines.append("")

    _emit_rules(entry_rules, "Entry signals")
    _emit_rules(exit_rules,  "Exit signals")

    lines += [
        "    return {",
        '        "action": signal,',
        '        "timestamp": data.get("timestamp"),',
        '        "confidence": 0.8,',
        "    }",
    ]

    return "\n".join(lines)