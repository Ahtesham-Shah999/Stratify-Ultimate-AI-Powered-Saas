from .sentiment_config import DEFAULT_PAGE_SIZE, SYMBOL_HINTS
from .sentiment_utils import normalize_pair, get_signal_for_score, get_explanation_for_score
from .sentiment_news import fetch_news_for_symbol, clean_and_deduplicate_articles
from .sentiment_analyzer import get_model, analyze_articles


def run_pair(pair: str, page_size: int = DEFAULT_PAGE_SIZE) -> dict:
    formatted_pair, base, quote = normalize_pair(pair)
    print(f"\n============================================================")
    print(f"  FOREX COMPARATIVE SENTIMENT  |  {base} vs {quote}")
    print(f"============================================================\n")

    raw_base_news = fetch_news_for_symbol(base, page_size)
    raw_quote_news = fetch_news_for_symbol(quote, page_size)

    clean_base_news = clean_and_deduplicate_articles(raw_base_news, base)
    clean_quote_news = clean_and_deduplicate_articles(raw_quote_news, quote)

    model = get_model()
    result_base = analyze_articles(clean_base_news, base, model)
    result_quote = analyze_articles(clean_quote_news, quote, model)

    pair_score_a = round(result_base["avg_score"] - result_quote["avg_score"], 4)
    recommendation_a = get_signal_for_score(pair_score_a)
    
    base_name = SYMBOL_HINTS.get(base, base)
    quote_name = SYMBOL_HINTS.get(quote, quote)
    explanation = get_explanation_for_score(pair_score_a, base_name, quote_name)

    # Extract all analyzed articles for both base and quote currencies
    base_news = []
    for art in result_base.get("analyzed_articles", []):
        base_news.append({
            "title": art["title"],
            "url": art["url"],
            "source": art["source"],
            "label": art["label"],
            "score": art["signed_score"]
        })

    quote_news = []
    for art in result_quote.get("analyzed_articles", []):
        quote_news.append({
            "title": art["title"],
            "url": art["url"],
            "source": art["source"],
            "label": art["label"],
            "score": art["signed_score"]
        })

    total_analyzed = result_base.get("total", 0) + result_quote.get("total", 0)

    return {
        "pair": formatted_pair,
        "signal": recommendation_a,
        "score": pair_score_a,
        "explanation": explanation,
        "total_analyzed": total_analyzed,
        "base_news": base_news,
        "quote_news": quote_news
    }
