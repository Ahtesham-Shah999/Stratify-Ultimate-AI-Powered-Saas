import requests
from .sentiment_config import NEWS_API_KEY, NEWS_API_URL, DEFAULT_PAGE_SIZE
from .sentiment_utils import get_query_for_symbol


def fetch_news_for_symbol(symbol: str, page_size: int = DEFAULT_PAGE_SIZE) -> list:
    query = get_query_for_symbol(symbol)
    params = {
        "q": query,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": page_size,
        "apiKey": NEWS_API_KEY,
    }
    print(f"[FETCH] [{symbol}] Fetching news for: {query}")
    try:
        response = requests.get(NEWS_API_URL, params=params, timeout=12)
        response.raise_for_status()
        payload = response.json()
    except Exception as e:
        print(f"[ERROR] [{symbol}] Failed to fetch news: {e}")
        return []

    if payload.get("status") != "ok":
        print(f"[ERROR] [{symbol}] News API error: {payload.get('message', 'unknown')}")
        return []

    articles = payload.get("articles", [])
    print(f"[OK] [{symbol}] Retrieved {len(articles)} articles")
    return articles


def clean_and_deduplicate_articles(articles: list, symbol: str) -> list:
    seen_titles = set()
    seen_urls = set()
    cleaned = []

    for article in articles:
        title = (article.get("title") or "").strip()
        description = (article.get("description") or "").strip()
        url = (article.get("url") or "").strip()

        if not title or title.lower() == "[removed]" or "[removed]" in description.lower():
            continue
        if not description or len(description) < 15:
            continue

        norm_title = "".join(c for c in title.lower() if c.isalnum())
        if norm_title in seen_titles or url in seen_urls:
            continue

        seen_titles.add(norm_title)
        if url:
            seen_urls.add(url)

        cleaned.append(article)

    return cleaned
