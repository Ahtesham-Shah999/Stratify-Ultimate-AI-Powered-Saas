# FastAPI AI Engine microservice for Stratify strategy parsing and validation
# Run server: uvicorn main:app --reload --port 8001
# Run tests: pytest -q

from fastapi import FastAPI, HTTPException, status
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import uuid
import logging
from typing import Optional

from backtesting.service import BacktestingService

from strategy_parser.service import StrategyParser
from validation.service import StrategyValidatorService
from utils.logger import get_logger
from utils.config import get_config

config = get_config()
logger = get_logger(__name__)

app = FastAPI(
    title="Stratify AI Engine",
    description="Parsing and validation microservice for trading strategies",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

parser_service = StrategyParser()
validator_service = StrategyValidatorService()
backtesting_service = BacktestingService()

# Simple in-memory counter for demo metrics
parse_call_count = 0
validate_call_count = 0


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    logger.info(f"Starting Stratify AI Engine in {config.ENV} mode")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "ai-engine"}


@app.post("/parse-strategy")
async def parse_strategy(request: dict):
    """
    Parse a natural language strategy description and generate trading rules.
    
    Request body:
    {
        "user_id": "user_123",
        "language_input": "Buy BTC when RSI < 30",
        "symbol": "BTC",
        "timeframe": "1h",
        "initial_capital": 10000
    }
    
    Response:
    {
        "strategy_id": "strategy_abc123",
        "generated_rules": [...],
        "code_blob": "def strategy(data): ...",
        "meta": {
            "symbols": ["BTC"],
            "timeframe": "1h",
            "initial_capital": 10000
        },
        "warnings": []
    }
    """
    global parse_call_count
    parse_call_count += 1
    
    request_id = str(uuid.uuid4())
    logger.info(f"[{request_id}] Parse request from user {request.get('user_id')}")
    
    try:
        # Build context from request
        context = {
            "symbol": request.get("symbol"),
            "timeframe": request.get("timeframe"),
            "initial_capital": request.get("initial_capital"),
        }
        
        # Call parser service
        result = parser_service.parse(request.get("language_input"), context)

        # Ensure owner_id and a sensible name are present when AI omits them
        if not result.get("owner_id"):
            result["owner_id"] = request.get("user_id")

        if not result.get("name"):
            try:
                indicator = None
                gen = result.get("generated_rules") or {}
                if isinstance(gen, dict):
                    indicator = gen.get("indicator")
                elif isinstance(gen, list) and len(gen) > 0 and isinstance(gen[0], dict):
                    indicator = gen[0].get("indicator")
                result["name"] = f"{indicator} Strategy" if indicator else "Strategy"
            except Exception:
                result["name"] = "Strategy"

        # `generated_rules` can be a dict (compact spec) or a list (legacy);
        # result is a plain dict
        try:
            rule_count = len(result.get("generated_rules") or [])
        except Exception:
            rule_count = 1
        logger.info(f"[{request_id}] Parse completed with {rule_count} rules/items")
        return JSONResponse(content=result)
        
    except ValueError as e:
        logger.error(f"[{request_id}] Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        error_msg = str(e)
        # Return 429 for rate-limit errors so the frontend can retry
        if "rate limit" in error_msg.lower() or "busy" in error_msg.lower():
            logger.warning(f"[{request_id}] Rate limit error: {error_msg}")
            raise HTTPException(status_code=429, detail=error_msg)
        logger.error(f"[{request_id}] Runtime error: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        logger.error(f"[{request_id}] Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/validate-strategy")
async def validate_strategy(request: dict):
    """
    Validate parsed trading rules for syntax, logic, and risk.
    
    Request body:
    {
        "strategy_id": "strategy_abc123",
        "generated_rules": [...],
        "symbol": "BTC",
        "timeframe": "1h",
        "initial_capital": 10000
    }
    
    Response:
    {
        "valid": false,
        "errors": ["error1", "error2"],
        "warnings": ["warning1"],
        "risk_score": 45,
        "suggested_changes": [
            {"path": "generated_rules[0]", "suggestion": "..."}
        ]
    }
    """
    global validate_call_count
    validate_call_count += 1
    
    request_id = str(uuid.uuid4())
    logger.info(f"[{request_id}] Validate request for strategy {request.get('strategy_id')}")
    
    try:
        # Build context
        context = {
            "symbol": request.get("symbol"),
            "timeframe": request.get("timeframe"),
            "initial_capital": request.get("initial_capital"),
        }

        # Normalize generated_rules: accept either compact dict or list-of-rules
        raw_rules = request.get("generated_rules")
        if isinstance(raw_rules, dict):
            # Pass the compact spec directly to the validator service
            rules_for_validation = raw_rules
        else:
            rules_for_validation = raw_rules

        # Call validator service — pass normalized rules list
        result = validator_service.validate(rules_for_validation, context, request_id)

        logger.info(f"[{request_id}] Validation completed. Valid={result.get('valid')}, Risk={result.get('risk_score')}")
        return JSONResponse(content=result)
        
    except ValueError as e:
        logger.error(f"[{request_id}] Validation error: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"[{request_id}] Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/generate-code")
async def generate_code(request: dict):
    """
    Generate backtesting Python code from strategy rules.
    
    Request body:
    {
        "strategy_id": "strat_abc123",
        "generated_rules": {
            "pair": "EURUSD",
            "indicator": "RSI",
            "buy": "rsi < 30",
            "sell": "rsi > 70",
            "stop_loss": null,
            "take_profit": null
        },
        "timeframe": "1h",
        "initial_capital": 10000
    }
    
    Response:
    {
        "strategy_id": "strat_abc123",
        "code": "...generated python code...",
        "executable": true
    }
    """
    request_id = str(uuid.uuid4())
    strategy_id = request.get("strategy_id")
    logger.info(f"[{request_id}] Backtesting code generation request for {strategy_id}")
    
    try:
        # Build rules dict from request
        generated_rules = request.get("generated_rules", {})
        rules = {
            "pair": generated_rules.get("pair"),
            "indicator": generated_rules.get("indicator"),
            "buy": generated_rules.get("buy"),
            "sell": generated_rules.get("sell"),
            "stop_loss": generated_rules.get("stop_loss"),
            "take_profit": generated_rules.get("take_profit"),
            "timeframe": request.get("timeframe"),
            "initial_capital": request.get("initial_capital"),
        }
        
        # Generate code
        code = backtesting_service.generate_code(rules)
        
        logger.info(f"[{request_id}] Code generation completed")
        return {
            "strategy_id": strategy_id,
            "code": code,
            "executable": True,
        }
        
    except ValueError as e:
        logger.error(f"[{request_id}] Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"[{request_id}] Code generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/run-backtest")
async def run_backtest(request: dict):
    """
    Run a backtest and collect results synchronously.
    
    Request body:
    {
        "strategy_id": "strat_abc123",
        "generated_rules": {
            "pair": "EURUSD",
            "indicator": "RSI",
            "buy": "rsi < 30",
            "sell": "rsi > 70",
            "stop_loss": null,
            "take_profit": null
        },
        "timeframe": "1h",
        "initial_capital": 10000,
        "timeout": 400
    }
    
    Response: Result dict with trades, result, and errors.
    """
    request_id = str(uuid.uuid4())
    strategy_id = request.get("strategy_id")
    logger.info(f"[{request_id}] Backtest run request for {strategy_id}")
    
    try:
        # Build rules dict from request
        generated_rules = request.get("generated_rules", {})
        rules = {
            "pair": generated_rules.get("pair"),
            "indicator": generated_rules.get("indicator"),
            "buy": generated_rules.get("buy"),
            "sell": generated_rules.get("sell"),
            "stop_loss": generated_rules.get("stop_loss"),
            "take_profit": generated_rules.get("take_profit"),
            "timeframe": request.get("timeframe"),
            "initial_capital": request.get("initial_capital"),
            "start_date": request.get("start_date"),
            "end_date": request.get("end_date"),
        }
        
        timeout = request.get("timeout", 400)
        
        # Run backtest
        result = backtesting_service.run_backtest(strategy_id, rules, timeout=timeout)
        
        logger.info(f"[{request_id}] Backtest completed")
        return JSONResponse(content=result)
        
    except ValueError as e:
        logger.error(f"[{request_id}] Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except TimeoutError as e:
        logger.error(f"[{request_id}] Timeout error: {str(e)}")
        raise HTTPException(status_code=408, detail="Backtest timed out")
    except FileNotFoundError as e:
        logger.error(f"[{request_id}] File not found: {str(e)}")
        raise HTTPException(status_code=404, detail="Strategy script not found")
    except Exception as e:
        logger.error(f"[{request_id}] Backtest error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stream-backtest/{strategy_id}")
async def stream_backtest(
    strategy_id: str,
    indicator: str,
    pair: str,
    buy: str,
    sell: str,
    timeframe: str = "1h",
    initial_capital: float = 10000,
    stop_loss: Optional[float] = None,
    take_profit: Optional[float] = None,
    timeout: int = 400,
):
    """
    Stream backtest execution output in real-time using Server-Sent Events.
    
    Query Parameters:
    - strategy_id: Identifier for the strategy
    - indicator: Technical indicator (RSI, MACD, SMA, etc.)
    - pair: Trading pair (e.g., EURUSD)
    - buy: Buy condition (e.g., "rsi < 30")
    - sell: Sell condition (e.g., "rsi > 70")
    - timeframe: Candlestick timeframe (default: 1h)
    - initial_capital: Starting capital (default: 10000)
    - stop_loss: Stop loss percentage (optional)
    - take_profit: Take profit percentage (optional)
    - timeout: Max seconds to run (default: 400)
    
    Returns: Server-Sent Events stream with JSON objects.
    """
    request_id = str(uuid.uuid4())
    logger.info(f"[{request_id}] Backtest stream request for {strategy_id}")
    
    try:
        # Build rules dict from query parameters
        rules = {
            "pair": pair,
            "indicator": indicator,
            "buy": buy,
            "sell": sell,
            "stop_loss": stop_loss,
            "take_profit": take_profit,
            "timeframe": timeframe,
            "initial_capital": initial_capital,
        }
        
        # Get generator from service (does not iterate)
        generator = backtesting_service.stream_backtest(strategy_id, rules)
        
        logger.info(f"[{request_id}] Backtest stream started")
        return StreamingResponse(
            generator,
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )
        
    except ValueError as e:
        logger.error(f"[{request_id}] Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"[{request_id}] Stream error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/metrics")
async def get_metrics():
    """Return basic service metrics."""
    return {
        "parse_calls": parse_call_count,
        "validate_calls": validate_call_count,
    }


@app.post("/debug/parse-ai-raw")
async def debug_parse_ai_raw(request: dict):
    """
    DEBUG ENDPOINT: See raw AI output from parser (before any processing).
    
    Returns exactly what Gemini returns for parsing.
    """
    request_id = str(uuid.uuid4())
    logger.info(f"[{request_id}] DEBUG: Raw parser AI request")
    
    try:
        language_input = request.get("language_input", "")
        context = {
            "symbol": request.get("symbol"),
            "timeframe": request.get("timeframe"),
            "initial_capital": request.get("initial_capital"),
        }
        
        # Call Gemini directly via parser
        from utils.config import get_config
        from utils.gemini_client import call_gemini
        import json
        
        config_obj = get_config()
        model = getattr(config_obj, "GENAI_MODEL", "gemini-2.0-flash")
        
        # Use the same prompt as the parser
        prompt = (
            "You are a professional trading strategy parser. If input is something out of the trading world than respond with null values for all fields.\n"
            "Input: a single-line natural language strategy description and optional context (symbol, timeframe).\n"
            "Output: a single JSON object (no surrounding text) that matches the exact schema below.\n\n"
            "SCHEMA:\n"
            "{\n"
            "  \"owner_id\": string or null,\n"
            "  \"name\": string or null,\n"
            "  \"description\": string or null,\n"
            "  \"language_input\": string,\n"
            "  \"generated_rules\": {\n"
            "      \"pair\": string,\n"
            "      \"indicator\": string,\n"
            "      \"buy\": string,\n"
            "      \"sell\": string,\n"
            "      \"stop_loss\": number or null,\n"
            "      \"take_profit\": number or null\n"
            "  },\n"
            "  \"initial_capital\": number or null,\n"
            "  \"engine_type\": string or null,\n"
            "  \"visibility\": string or null\n"
            "}\n\n"
            "EXAMPLE INPUT: in BTCUSDT Buy when MACD crosses above signal line; sell when below.\n"
            "EXAMPLE OUTPUT:\n"
            "{\n"
            "  \"owner_id\": \"675f1c97d3b4a9e192bf12cd\",\n"
            "  \"name\": \"MACD Trend Strategy\",\n"
            "  \"description\": \"A technical strategy based on MACD crossovers.\",\n"
            "  \"language_input\": \"in BTCUSDT Buy when MACD crosses above signal line; sell when below.\",\n"
            "  \"generated_rules\": {\"pair\": \"BTCUSDT\", \"indicator\": \"MACD\", \"buy\": \"macd > signal\", \"sell\": \"macd < signal\", \"stop_loss\": 0.02, \"take_profit\": 0.05},\n"
            "  \"initial_capital\": 10000,\n"
            "  \"engine_type\": \"BACKTEST\",\n"
            "  \"visibility\": \"PUBLIC\"\n"
            "}\n\n"
            "CRITICAL: Return only the JSON object above and nothing else. If a value is not present, use null for that field.\n"
        )
        
        messages = [{"role": "user", "content": prompt + "\n\nContext:\n" + json.dumps(context) + "\n\nText:\n" + language_input}]
        
        # Call Gemini
        gemini_response = call_gemini(model, messages)
        
        return {
            "request_id": request_id,
            "user_input": language_input,
            "context": context,
            "gemini_raw_text": gemini_response.get("text", ""),
            "gemini_parsed_json": gemini_response.get("json"),
            "gemini_error": gemini_response.get("error"),
        }
        
    except Exception as e:
        logger.error(f"[{request_id}] DEBUG parse error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/debug/validate-ai-raw")
async def debug_validate_ai_raw(request: dict):
    """
    DEBUG ENDPOINT: See raw AI output from validator (before any processing).
    
    Returns exactly what Gemini returns for validation.
    """
    request_id = str(uuid.uuid4())
    logger.info(f"[{request_id}] DEBUG: Raw validator AI request")
    
    try:
        rules = request.get("generated_rules", [])
        context = {
            "symbol": request.get("symbol"),
            "timeframe": request.get("timeframe"),
            "initial_capital": request.get("initial_capital"),
        }
        
        # Call Gemini directly via validator
        from utils.config import get_config
        from utils.gemini_client import call_gemini
        import json
        
        config_obj = get_config()
        model = getattr(config_obj, "GENAI_MODEL", "gemini-2.0-flash")
        
        # Use the validator prompt
        prompt = (
            "You are a professional trading strategy validator. Validate trading rules and return ONLY valid JSON with NO explanations or text outside JSON.\n\n"
            "VALIDATION RULES:\n"
            "1. indicator MUST be from known indicators list (provided below)\n"
            "2. operator MUST be: <, >, <=, >=, ==, !=\n"
            "3. action MUST be: BUY, SELL, or HOLD (uppercase)\n"
            "4. value MUST be numeric, not string\n"
            "5. confidence MUST be 0 to 1 (decimal)\n"
            "6. Check for logical contradictions\n\n"
            "SCORING:\n"
            "- Base: risk_score = 10\n"
            "- Add 20 per error\n"
            "- Add 10 per warning\n"
            "- Cap at 100 max\n\n"
            "JSON SCHEMA:\n"
            '{\"valid\": true/false, \"errors\": [...], \"warnings\": [...], \"risk_score\": 0-100, \"suggested_changes\": [{\"path\": \"...\", \"suggestion\": \"...\"}]}\n\n'
            "EXAMPLE 1 (VALID):\n"
            "INPUT: {\"generated_rules\": [{\"indicator\": \"RSI\", \"operator\": \"<\", \"value\": 30, \"action\": \"BUY\", \"confidence\": 0.9}]}\n"
            "OUTPUT: {\"valid\": true, \"errors\": [], \"warnings\": [], \"risk_score\": 10.0, \"suggested_changes\": []}\n\n"
            "EXAMPLE 2 (INVALID - unknown indicator):\n"
            "INPUT: {\"generated_rules\": [{\"indicator\": \"UNKNOWN\", \"operator\": \"<\", \"value\": 30, \"action\": \"BUY\", \"confidence\": 0.3}]}\n"
            "OUTPUT: {\"valid\": false, \"errors\": [\"Indicator UNKNOWN is not in the list of known indicators\"], \"warnings\": [\"Confidence 0.3 is low\"], \"risk_score\": 50.0, \"suggested_changes\": [{\"path\": \"/generated_rules[0]/indicator\", \"suggestion\": \"Use a known indicator\"}]}\n\n"
            "Known indicators: RSI, MACD, SMA, EMA, Volume, Price, Support, Resistance, Stochastic, ATR, BollingerBand\n\n"
            "CRITICAL:\n"
            "1. Return ONLY JSON\n"
            "2. valid is boolean (true or false)\n"
            "3. Errors make valid=false\n"
            "4. Warnings do NOT make valid=false but increase risk_score\n"
        )
        
        messages = [{"role": "user", "content": prompt + "\n\nParsed JSON:\n" + json.dumps({"generated_rules": rules, "meta": context}, default=str)}]
        
        # Call Gemini
        gemini_response = call_gemini(model, messages)
        
        return {
            "request_id": request_id,
            "rules_input": rules,
            "context": context,
            "gemini_raw_text": gemini_response.get("text", ""),
            "gemini_parsed_json": gemini_response.get("json"),
            "gemini_error": gemini_response.get("error"),
        }
        
    except Exception as e:
        logger.error(f"[{request_id}] DEBUG validate error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sentiment")
async def get_sentiment(pair: str):
    """
    Get comparative sentiment analysis for a forex or crypto pair.
    
    Query Parameters:
    - pair: The trading pair (e.g., 'EUR/USD', 'BTCUSDT')
    
    Returns: JSON with sentiment scores and top news articles.
    """
    request_id = str(uuid.uuid4())
    logger.info(f"[{request_id}] Sentiment analysis request for {pair}")
    
    try:
        from sentiment_analysis.sentiment_runner import run_pair
        
        # Run sentiment analysis
        result = run_pair(pair)
        
        logger.info(f"[{request_id}] Sentiment analysis completed for {pair}")
        return JSONResponse(content=result)
        
    except ValueError as e:
        logger.error(f"[{request_id}] Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"[{request_id}] Sentiment analysis error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
