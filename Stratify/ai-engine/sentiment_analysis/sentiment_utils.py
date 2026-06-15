import re
from .sentiment_config import KNOWN_QUOTES, FOREX_QUERIES, SYMBOL_HINTS


def normalize_pair(pair: str) -> tuple[str, str, str]:
    raw = re.sub(r"[^A-Z0-9]", "", pair.strip().upper())
    if not raw:
        raise ValueError("Pair is required, e.g. EUR/USD or USD/JPY")

    for suffix in sorted(KNOWN_QUOTES, key=len, reverse=True):
        if raw.endswith(suffix) and len(raw) > len(suffix):
            base = raw[: len(raw) - len(suffix)]
            quote = suffix
            return f"{base}/{quote}", base, quote

    if len(raw) == 6:
        base, quote = raw[:3], raw[3:]
        return f"{base}/{quote}", base, quote

    raise ValueError("Unable to parse the pair. Use a pair like EUR/USD, GBP/USD, USD/JPY.")


def get_query_for_symbol(symbol: str) -> str:
    symbol_upper = symbol.upper()
    if symbol_upper in FOREX_QUERIES:
        return FOREX_QUERIES[symbol_upper]

    hint = SYMBOL_HINTS.get(symbol_upper, "")
    if hint:
        return f"{symbol_upper} OR \"{hint} economy\" OR \"{hint} currency\""

    return f"{symbol_upper} OR \"{symbol_upper} currency\" OR \"{symbol_upper} economy\""


def get_signal_for_score(score: float) -> str:
    if score > 0.05:
        return "BUY"
    elif score < -0.05:
        return "SELL"
    else:
        return "HOLD"

def get_explanation_for_score(score: float, base_name: str, quote_name: str) -> str:
    if score > 0.05:
        return f"Recent news sentiment suggests the {base_name} is stronger than the {quote_name}. The price may move higher."
    elif score < -0.05:
        return f"Recent news sentiment suggests the {base_name} is weaker than the {quote_name}. The price may move lower."
    else:
        return "Recent news sentiment does not provide a strong directional bias."
