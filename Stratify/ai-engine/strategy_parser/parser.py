"""Strategy parser implementation with deterministic fallback."""

import re
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
import json

from utils.config import get_config
from utils.gemini_client import call_gemini

from .models import GeneratedRule

logger = logging.getLogger(__name__)
config = get_config()


class StrategyParser:
    """
    Deterministic strategy parser for natural language trading rules.
    
    Handles common trading phrases and generates structured rules.
    Designed to be modular so NLP models can be injected later.
    """
    
    # Indicator patterns for regex-based fallback parser
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
    
    def __init__(self):
        """Initialize parser with default backend."""
        self.backend = None  # TODO: replace stub with real NLP model (huggingface/openai)
    
    def parse(
        self,
        language_input: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> List[GeneratedRule]:
        """
        Parse natural language strategy input into structured rules.
        
        Args:
            language_input: Natural language strategy description
            context: Optional context with symbol, timeframe, initial_capital
            
        Returns:
            List of GeneratedRule objects
        """
        if not language_input or not isinstance(language_input, str):
            raise ValueError("language_input must be a non-empty string")
        
        context = context or {}

        # Use Gemini parsing as requested (no pluggable fallback)
        rules = self._parse_with_gemini(language_input, context)
        return rules

    def _parse_with_gemini(self, language_input: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """New parse: return a compact full strategy spec matching user's desired JSON.

        This method asks the Gemini model to produce the top-level strategy
        specification (owner_id, name, description, language_input, generated_rules)
        where `generated_rules` is an object like:
            {"pair":"EURUSD","indicator":"MACD","buy":"macd > signal","sell":"macd < signal","stop_loss":0.02,"take_profit":0.05}
        """
        model = getattr(config, "GENAI_MODEL", "gemini-2.0-flash")

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
   d) A TIMEFRAME (e.g. 1m, 5m, 15m, 1h, 4h, 1D)
   e) An INITIAL CAPITAL amount (e.g. 1000, 5000, 10000)

3. REJECTION RULES — REJECT if ANY of the following are true:
   - Input is an emotional statement ("I love EURUSD")
   - Input is casual market commentary ("EURUSD looks bullish today")
   - Input is a greeting ("Hello", "Hi", "What's up")
   - Input is a prediction WITHOUT a rule ("GBPUSD will go up tomorrow")
   - Input only mentions a symbol with NO strategy logic
   - Input is missing the FOREX PAIR → REJECT with warning
   - Input is missing the INITIAL CAPITAL → REJECT with warning
   - Input uses NON-FOREX instruments (stocks, crypto like BTC, ETH, indices like SPX)
   - Input uses unsupported indicators (EMA, ATR, Bollinger alone without BB keyword, VWAP, etc.)

4. SUPPORTED INDICATORS ONLY (reject any other indicator):
   - RSI
   - MACD
   - SMA
   - BollingerBand (triggered by: BB, Bollinger, Bollinger Bands)
   - Stochastic

5. SUPPORTED FOREX PAIRS ONLY:
   - Major pairs: EURUSD, GBPUSD, USDJPY, USDCHF, USDCAD, AUDUSD, NZDUSD
   - Gold: XAUUSD
   - Cross pairs: EURGBP, EURJPY, GBPJPY, AUDCAD, etc.
   - Any standard forex pair in format XXXYYY

6. You MUST NOT invent or assume ANY information.
   If a field is not explicitly stated → return null for that field.

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
      "pair": string or null,
      "indicator": string or null,
      "buy": string or null,
      "sell": string or null,
      "stop_loss": number or null,
      "take_profit": number or null,
      "timeframe": string or null
  },
  "initial_capital": number or null,
  "engine_type": "BACKTEST" or null,
  "visibility": "PUBLIC" or null,
  "warnings": []
}

=====================================================
STRICT JSON RULES
=====================================================
- STRING fields: exact words from input, lowercase allowed.
- NUMBERS: float, not string.
- No comments, no trailing commas.
- If unsure → null.

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
    "take_profit": null,
    "timeframe": null
  },
  "initial_capital": null,
  "engine_type": null,
  "visibility": null,
  "warnings": ["<reason for rejection>"]
}

=====================================================
GOOD TRADING EXAMPLES (ALL FIELDS PRESENT)
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
    "take_profit": 0.05,
    "timeframe": "1h"
  },
  "initial_capital": 10000,
  "engine_type": null,
  "visibility": null,
  "warnings": []
}

Example 2 — MISSING TIMEFRAME → REJECT
Input: "Buy EURUSD when MACD crosses above signal. Capital 5000."
Output:
{
  "owner_id": null,
  "name": null,
  "description": "Non-trading input rejected",
  "language_input": "Buy EURUSD when MACD crosses above signal. Capital 5000.",
  "generated_rules": {
    "pair": null,
    "indicator": null,
    "buy": null,
    "sell": null,
    "stop_loss": null,
    "take_profit": null,
    "timeframe": null
  },
  "initial_capital": null,
  "engine_type": null,
  "visibility": null,
  "warnings": ["Timeframe not specified in input"]
}

Example 3 — MISSING PAIR → REJECT
Input: "Buy when RSI < 30 on 4h chart. Capital 2000."
Output:
{
  "owner_id": null,
  "name": null,
  "description": "Non-trading input rejected",
  "language_input": "Buy when RSI < 30 on 4h chart. Capital 2000.",
  "generated_rules": {
    "pair": null,
    "indicator": null,
    "buy": null,
    "sell": null,
    "stop_loss": null,
    "take_profit": null,
    "timeframe": null
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
    "pair": null,
    "indicator": null,
    "buy": null,
    "sell": null,
    "stop_loss": null,
    "take_profit": null,
    "timeframe": null
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
    "pair": null,
    "indicator": null,
    "buy": null,
    "sell": null,
    "stop_loss": null,
    "take_profit": null,
    "timeframe": null
  },
  "initial_capital": null,
  "engine_type": null,
  "visibility": null,
  "warnings": ["Only forex pairs are supported. Crypto/stock instruments are not accepted."]
}

Example 6 — UNSUPPORTED INDICATOR → REJECT
Input: "Buy EURUSD when EMA 50 crosses EMA 200 on 4h. Capital 3000."
Output:
{
  "owner_id": null,
  "name": null,
  "description": "Non-trading input rejected",
  "language_input": "Buy EURUSD when EMA 50 crosses EMA 200 on 4h. Capital 3000.",
  "generated_rules": {
    "pair": null,
    "indicator": null,
    "buy": null,
    "sell": null,
    "stop_loss": null,
    "take_profit": null,
    "timeframe": null
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

        messages = [{"role": "user", "content": prompt + "\n\nContext:\n" + json.dumps(context) + "\n\nText:\n" + language_input}]

        resp = call_gemini(model, messages)
        if resp.get("error"):
            raise RuntimeError(f"Gemini API error: {resp['error']}")

        parsed = resp.get("json")
        text = resp.get("text", "")
        if parsed is None:
            # Try to parse JSON substring from text
            try:
                start = text.find("{")
                end = text.rfind("}")
                if start != -1 and end != -1:
                    parsed = json.loads(text[start:end+1])
            except Exception:
                parsed = None

        if not parsed or not isinstance(parsed, dict):
            raise ValueError("Parser did not return a valid strategy spec JSON")

        # Normalize/ensure fields exist
        spec = {
            "owner_id": parsed.get("owner_id"),
            "name": parsed.get("name"),
            "description": parsed.get("description"),
            "language_input": parsed.get("language_input") or language_input,
            "generated_rules": parsed.get("generated_rules") or {},
            "initial_capital": parsed.get("initial_capital") or context.get("initial_capital"),
            "engine_type": parsed.get("engine_type"),
            "visibility": parsed.get("visibility"),
        }

        return spec
    
    def _parse_sentence(
        self,
        sentence: str,
        context: Dict[str, Any],
    ) -> Optional[GeneratedRule]:
        """
        Parse a single sentence into a rule.
        
        Examples:
            "Buy EURUSD when RSI < 30" → GeneratedRule
            "Sell when MACD > 0" → GeneratedRule
        """
        sentence_lower = sentence.lower()
        
        # Extract action (BUY/SELL/HOLD)
        action = self._extract_action(sentence_lower)
        if not action:
            return None
        
        # Extract indicator, operator, value
        indicator, operator, value = self._extract_condition(sentence_lower)
        if not indicator or not operator or value is None:
            return None
        
        # Extract symbol if mentioned
        symbol = self._extract_symbol(sentence, context.get("symbol"))
        
        # Determine logic type
        logic = self._determine_logic(sentence_lower)
        
        rule = GeneratedRule(
            indicator=indicator,
            operator=operator,
            value=float(value),
            action=action,
            logic=logic,
            confidence=0.85,  # Default confidence
        )
        
        return rule
    
    def _extract_action(self, sentence: str) -> Optional[str]:
        """Extract trading action from sentence."""
        for pattern, action in self.ACTIONS.items():
            if re.search(pattern, sentence, re.IGNORECASE):
                return action
        return None
    
    def _extract_condition(
        self,
        sentence: str,
    ) -> tuple[Optional[str], Optional[str], Optional[float]]:
        """
        Extract indicator, operator, and value from sentence.
        
        Returns: (indicator, operator, value)
        """
        # Find indicator
        indicator = None
        for pattern, ind_name in self.INDICATORS.items():
            if re.search(pattern, sentence, re.IGNORECASE):
                indicator = ind_name
                break
        
        if not indicator:
            return None, None, None
        
        # Find operator and value
        # Must match multi-character operators first (>=, <=, ==, !=)
        pattern = r'(<=|>=|==|!=|<|>)\s*(\d+(?:\.\d+)?)'
        match = re.search(pattern, sentence)
        
        if not match:
            return indicator, None, None
        
        operator = match.group(1)
        value = float(match.group(2))
        
        return indicator, operator, value
    
    def _extract_symbol(self, sentence: str, default_symbol: Optional[str]) -> str:
        """Extract forex trading symbol from sentence."""
        # Look for uppercase forex pairs (EURUSD, GBPUSD, etc.)
        pattern = r'\b([A-Z]{6})\b'
        matches = re.findall(pattern, sentence)
        
        return matches[0] if matches else (default_symbol or "")
    
    def _determine_logic(self, sentence: str) -> str:
        """Determine logic type (ENTRY, EXIT, FILTER)."""
        if re.search(r'\b(exit|close|sell)\b', sentence):
            return "EXIT"
        elif re.search(r'\b(filter|condition)\b', sentence):
            return "FILTER"
        else:
            return "ENTRY"
    
    def _fallback_parse(
        self,
        language_input: str,
        context: Dict[str, Any],
    ) -> List[GeneratedRule]:
        """
        Fallback parsing when sentence-based parsing fails.
        
        Applies simpler regex patterns for common phrases.
        Supports only: RSI, MACD, SMA, BollingerBand, Stochastic
        """
        rules = []
        language_lower = language_input.lower()
        
        # Try to match patterns like "buy/sell when [condition]"
        if 'buy' in language_lower or 'sell' in language_lower:
            action = 'BUY' if 'buy' in language_lower else 'SELL'
            
            # Look for any supported indicator + operator + value
            for ind_pattern, indicator in self.INDICATORS.items():
                if re.search(ind_pattern, language_input, re.IGNORECASE):
                    pattern = r'(<=|>=|==|!=|<|>)\s*(\d+(?:\.\d+)?)'
                    match = re.search(pattern, language_input)
                    if match:
                        rule = GeneratedRule(
                            indicator=indicator,
                            operator=match.group(1),
                            value=float(match.group(2)),
                            action=action,
                            logic="ENTRY",
                            confidence=0.70,
                        )
                        rules.append(rule)
                        break
        
        return rules


def generate_python_code(rules, include_comments: bool = True) -> str:
    """
    Generate safe Python code from validated rules.
    
    This is deterministic and safe (no I/O). Not executed in the API process.
    
    Args:
        rules: List of GeneratedRule objects
        include_comments: Whether to include comments in output
        
    Returns:
        Python code string implementing strategy function
    """
    lines = []
    
    if include_comments:
        lines.append("# Auto-generated strategy function")
        lines.append("# Generated by Stratify AI Engine")
        lines.append("")
    
    lines.append("def strategy(data):")
    lines.append('    """')
    lines.append("    Execute strategy based on generated rules.")
    lines.append("    ")
    lines.append("    Args:")
    lines.append("        data: Dictionary with OHLCV data and indicators")
    lines.append("    ")
    lines.append("    Returns:")
    lines.append("        Dict with 'action' (BUY/SELL/HOLD) and optional metadata")
    lines.append('    """')
    lines.append('    signal = "HOLD"')
    lines.append("")
    
    # Normalize rules: accept either objects with attributes or plain dicts
    normalized = []
    for r in rules:
        if isinstance(r, dict):
            normalized.append(r)
        else:
            normalized.append({
                "indicator": getattr(r, "indicator", None),
                "operator": getattr(r, "operator", None),
                "value": getattr(r, "value", None),
                "action": getattr(r, "action", None),
                "logic": getattr(r, "logic", "ENTRY"),
            })

    entry_rules = [r for r in normalized if (r.get("logic") or "ENTRY") == "ENTRY"]
    exit_rules = [r for r in normalized if (r.get("logic") or "ENTRY") == "EXIT"]
    
    if entry_rules:
        if include_comments:
            lines.append("    # Entry signals")
        for i, rule in enumerate(entry_rules):
            ind = rule.get("indicator")
            op = rule.get("operator")
            val = rule.get("value")
            act = rule.get("action")
            lines.append(f"    # Rule {i + 1}: {ind} {op} {val}")
            indicator_var = (ind or "").lower()
            lines.append(f"    if data.get('{indicator_var}') {op} {val}:")
            lines.append(f'        signal = "{act}"')
        lines.append("")
    
    if exit_rules:
        if include_comments:
            lines.append("    # Exit signals")
        for i, rule in enumerate(exit_rules):
            ind = rule.get("indicator")
            op = rule.get("operator")
            val = rule.get("value")
            act = rule.get("action")
            lines.append(f"    # Rule {i + 1}: {ind} {op} {val}")
            indicator_var = (ind or "").lower()
            lines.append(f"    if data.get('{indicator_var}') {op} {val}:")
            lines.append(f'        signal = "{act}"')
        lines.append("")
    
    lines.append("    return {")
    lines.append('        "action": signal,')
    lines.append('        "timestamp": data.get("timestamp"),')
    lines.append('        "confidence": 0.8,')
    lines.append("    }")
    
    return "\n".join(lines)