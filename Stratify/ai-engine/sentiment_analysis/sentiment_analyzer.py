from transformers import pipeline

_model = None


def get_model():
    global _model
    if _model is None:
        print("\n[MODEL] Loading ProsusAI/finbert sentiment-analysis pipeline...")
        _model = pipeline("sentiment-analysis", model="ProsusAI/finbert")
        print("[MODEL] Model loaded successfully\n")
    return _model


from .sentiment_config import MAX_ANALYZED_ARTICLES

def analyze_articles(articles: list, symbol: str, model, max_articles: int = MAX_ANALYZED_ARTICLES) -> dict:
    results = []
    
    # Process only up to max_articles
    articles_to_process = articles[:max_articles]
    
    for article in articles_to_process:
        title = (article.get("title") or "").strip()
        description = (article.get("description") or "").strip()
        text = f"{title}. {description}"[:512].strip()
        if not text:
            continue

        try:
            prediction = model(text)[0]
            label = prediction["label"].upper()
            confidence = round(prediction["score"], 4)
            if label == "POSITIVE":
                signed_score = confidence
            elif label == "NEGATIVE":
                signed_score = -confidence
            else:
                signed_score = 0.0
        except Exception as e:
            print(f"[ERROR] Sentiment model failed on text: {e}")
            continue

        results.append({
            "title": title or "(no title)",
            "description": description,
            "source": article.get("source", {}).get("name", "Unknown"),
            "url": article.get("url", "#"),
            "label": label.lower(),
            "confidence": confidence,
            "signed_score": signed_score,
        })

    if not results:
        return {
            "currency": symbol,
            "analyzed_articles": [],
            "avg_score": 0.0,
            "label_counts": {"positive": 0, "negative": 0, "neutral": 0},
            "total": 0,
        }

    avg_score = round(sum(item["signed_score"] for item in results) / len(results), 4)
    # Sort by absolute polarization so the most impactful news is at the top
    sorted_articles = sorted(results, key=lambda item: abs(item["signed_score"]), reverse=True)
    
    label_counts = {
        "positive": sum(1 for item in results if item["label"] == "positive"),
        "negative": sum(1 for item in results if item["label"] == "negative"),
        "neutral": sum(1 for item in results if item["label"] == "neutral"),
    }

    print(f"[RESULT] [{symbol}] average score: {avg_score:+.4f} (Pos: {label_counts['positive']}, Neg: {label_counts['negative']}, Neu: {label_counts['neutral']})")

    return {
        "currency": symbol,
        "analyzed_articles": sorted_articles,
        "avg_score": avg_score,
        "label_counts": label_counts,
        "total": len(results),
    }
