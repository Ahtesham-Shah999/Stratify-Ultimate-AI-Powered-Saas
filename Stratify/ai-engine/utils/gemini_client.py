"""Gemini (Google GenAI) client wrapper used by parser/validator."""

from typing import List, Dict, Any
import json
import logging
import os
import re
import time

logger = logging.getLogger(__name__)

try:
    from google import genai
except Exception:
    genai = None

def call_gemini(model: str, messages: List[Dict[str, str]], timeout: int = 30) -> Dict[str, Any]:
    """Call the Google Gemini API and return {'raw','text','json','error'}.

    - `model` is ignored; the actual model comes from GENAI_MODEL env var.
    - `messages` is a list of dicts with keys 'role' and 'content'.
    """

    # Build full prompt from messages
    full_text = "\n".join(m.get("content", "") for m in messages)

    # Read GenAI config from environment
    api_key = os.getenv("GENAI_API_KEY")
    env_model = os.getenv("GENAI_MODEL") or "gemini-2.5-flash"

    if genai is None:
        return {"raw": None, "text": "", "json": None, "error": "google-genai library not installed. Install with: pip install google-genai"}

    if not api_key:
        return {"raw": None, "text": "", "json": None, "error": "GENAI_API_KEY not set in environment"}

    # Extensive fallback models for 429 (Rate Limit) handling
    fallback_models = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.5-pro"]
    
    # Put the env_model first, then add the rest if they aren't the env_model
    models_to_try = [env_model] + [m for m in fallback_models if m != env_model]

    client = genai.Client(api_key=api_key)
    
    max_retries_per_model = 3
    base_backoff_sec = 10

    for current_model in models_to_try:
        for attempt in range(max_retries_per_model):
            try:
                # logger.info(f"Trying Gemini model: {current_model}, Attempt {attempt + 1}")
                resp = client.models.generate_content(model=current_model, contents=full_text)

                # Extract text from response robustly
                text = ""
                try:
                    text = getattr(resp, "text", None) or getattr(resp, "content", None) or str(resp)
                    if isinstance(text, list):
                        text = "\n".join(map(str, text))
                except Exception:
                    text = str(resp)

                # Try to parse JSON from response text
                parsed = None
                try:
                    if "```json" in text:
                        start = text.find("```json") + 7
                        end = text.find("```", start)
                        json_str = text[start:end].strip()
                    elif "```" in text:
                        start = text.find("```") + 3
                        end = text.find("```", start)
                        json_str = text[start:end].strip()
                    else:
                        match = re.search(r"\{[\s\S]*\}", text)
                        json_str = match.group(0) if match else text

                    parsed = json.loads(json_str)
                except Exception:
                    logger.debug("Could not parse JSON from Gemini response; returning raw text")
                    parsed = None

                if current_model != env_model:
                    logger.info(f"Successfully used fallback model: {current_model}")

                return {"raw": resp, "text": text, "json": parsed, "error": None}

            except Exception as e:
                error_msg = str(e)
                
                # If 404/NOT_FOUND, just skip to next model
                if "404" in error_msg or "NOT_FOUND" in error_msg:
                    logger.warning(f"Model '{current_model}' not found. Skipping to next fallback...")
                    break # Break the retry loop for this model, move to next model
                    
                # If 429/RESOURCE_EXHAUSTED, wait and retry
                if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                    if attempt < max_retries_per_model - 1:
                        sleep_time = base_backoff_sec * (2 ** attempt)
                        logger.warning(f"Gemini rate limit hit (429) for '{current_model}'. Sleeping {sleep_time}s before retry {attempt + 2}/{max_retries_per_model}...")
                        time.sleep(sleep_time)
                        continue
                    else:
                        logger.warning(f"Exhausted retries for '{current_model}' due to rate limits. Trying next fallback model...")
                        break # Break retry loop, move to next model

                # Other errors
                logger.error(f"Error calling Gemini API on {current_model}: {error_msg}")
                break # Move to next model on other errors
            
    return {"raw": None, "text": "", "json": None, "error": "Gemini API rate limit hit across all models. Please try again in a few minutes."}
