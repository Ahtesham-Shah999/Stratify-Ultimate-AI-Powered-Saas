import os

NEWS_API_KEY = os.environ.get("NEWS_API_KEY", "b5a3bb13375d4510a1e631eec6a9163d")
NEWS_API_URL = os.environ.get("NEWS_API_URL", "https://newsapi.org/v2/everything")
DEFAULT_PAGE_SIZE = 50
MAX_ANALYZED_ARTICLES = 30

SYMBOL_HINTS = {
    "BTC": "Bitcoin", "ETH": "Ethereum", "DOGE": "Dogecoin", "XRP": "Ripple",
    "LTC": "Litecoin", "BCH": "Bitcoin Cash", "BNB": "Binance Coin", "ADA": "Cardano",
    "SOL": "Solana", "MATIC": "Polygon", "DOT": "Polkadot", "EUR": "Euro European",
    "USD": "Dollar Federal Reserve", "GBP": "Pound Sterling Britain", "JPY": "Yen Japan",
    "AUD": "Australian Dollar", "CAD": "Canadian Dollar", "CHF": "Swiss Franc",
    "NZD": "New Zealand Dollar", "CNY": "Yuan China", "HKD": "Hong Kong Dollar",
    "SGD": "Singapore Dollar", "NOK": "Norwegian Krone", "SEK": "Swedish Krona",
    "MXN": "Mexican Peso", "INR": "Indian Rupee", "BRL": "Brazilian Real",
    "ZAR": "South African Rand", "TRY": "Turkish Lira",
}

# Advanced NewsAPI Queries using exact matches and AND operations 
# to force ONLY financial/crypto/market related news to be returned.
FOREX_QUERIES = {
    "EUR": "(\"EUR/USD\" OR \"Euro currency\" OR \"European Central Bank\" OR ECB) AND (forex OR economy OR inflation OR trading)",
    "USD": "(\"US Dollar\" OR DXY OR \"Federal Reserve\" OR FOMC) AND (forex OR economy OR inflation OR trading OR currency)",
    "GBP": "(\"British Pound\" OR GBP/USD OR Sterling OR \"Bank of England\") AND (forex OR economy OR inflation OR trading)",
    "JPY": "(\"Japanese Yen\" OR USD/JPY OR \"Bank of Japan\") AND (forex OR economy OR inflation OR trading)",
    "AUD": "(\"Australian Dollar\" OR AUD/USD OR \"Reserve Bank of Australia\") AND (forex OR economy OR inflation OR trading)",
    "CAD": "(\"Canadian Dollar\" OR USD/CAD OR \"Bank of Canada\") AND (forex OR economy OR inflation OR trading)",
    "CHF": "(\"Swiss Franc\" OR USD/CHF OR \"Swiss National Bank\") AND (forex OR economy OR inflation OR trading)",
    "NZD": "(\"New Zealand Dollar\" OR NZD/USD OR \"Reserve Bank of New Zealand\") AND (forex OR economy OR inflation OR trading)",

    "BTC": "(Bitcoin OR BTC) AND (crypto OR cryptocurrency OR ETF OR bullish OR bearish OR trading)",
    "ETH": "(Ethereum OR ETH) AND (crypto OR cryptocurrency OR ETF OR blockchain OR trading)",
    "XRP": "(Ripple OR XRP) AND (crypto OR cryptocurrency OR trading OR ledger)",
    "DOGE": "(Dogecoin OR DOGE) AND (crypto OR cryptocurrency OR trading)",
    "ADA": "(Cardano OR ADA) AND (crypto OR cryptocurrency OR trading)",
    "SOL": "(Solana OR SOL) AND (crypto OR cryptocurrency OR trading)",
    "BNB": "(\"Binance Coin\" OR BNB) AND (crypto OR cryptocurrency OR exchange)",
    "MATIC": "(Polygon OR MATIC) AND (crypto OR cryptocurrency OR trading)",
    "DOT": "(Polkadot OR DOT) AND (crypto OR cryptocurrency OR trading)",
    "LTC": "(Litecoin OR LTC) AND (crypto OR cryptocurrency OR trading)",
    "BCH": "(\"Bitcoin Cash\" OR BCH) AND (crypto OR cryptocurrency OR trading)",
}

KNOWN_QUOTES = ["USDT", "USDC", "BUSD", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD", "BTC", "ETH"]