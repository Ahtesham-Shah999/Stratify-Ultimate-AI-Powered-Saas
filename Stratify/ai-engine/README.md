# Stratify AI Engine

FastAPI microservice for parsing and validating trading strategies.

## Quick Start

### Run Server
```bash
uvicorn main:app --reload --port 8001
```

The server will be available at `http://localhost:8001`

Health check: `GET http://localhost:8001/health`

API docs: `http://localhost:8001/docs`

### Run Tests
```bash
pytest -q
```

### Run with Docker
```bash
docker build -t stratify-ai-engine .
docker run -p 8001:8001 stratify-ai-engine
```

## API Endpoints

### POST /parse-strategy
Parse natural language strategy description into trading rules.

**Request:**
```json
{
  "user_id": "user_123",
  "language_input": "Buy BTC when RSI < 30",
  "symbol": "BTC",
  "timeframe": "1h",
  "initial_capital": 10000
}
```

**Response:**
```json
{
  "strategy_id": "strat_abc123",
  "generated_rules": [
    {
      "indicator": "RSI",
      "operator": "<",
      "value": 30,
      "action": "BUY",
      "logic": "ENTRY",
      "confidence": 0.92,
      "group_id": null,
      "group_logic": null
    }
  ],
  "code_blob": null,
  "meta": {
    "symbols": ["BTC"],
    "timeframe": "1h",
    "initial_capital": 10000,
    "rule_count": 1
  },
  "warnings": []
}
```

### POST /validate-strategy
Validate trading rules for syntax, logic, and risk.

**Request:**
```json
{
  "strategy_id": "strat_abc123",
  "generated_rules": [...],
  "symbol": "BTC",
  "timeframe": "1h",
  "initial_capital": 10000
}
```

**Response:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "risk_score": 20.5,
  "suggested_changes": []
}
```

### POST /generate-code
Generate Python code from validated rules.

**Request:**
```json
{
  "generated_rules": [...],
  "include_comments": true
}
```

**Response:**
```json
{
  "code": "def strategy(data): ...",
  "executable": true,
  "request_id": "..."
}
```

### GET /metrics
Get service metrics.

## Project Structure

```
ai-engine/
├── main.py                         # FastAPI app
├── requirements.txt                # dependencies
├── Dockerfile                      # container config
├── backtesting/
│   ├── __init__.py
│   └── market_interface.py         # market data interface (stub)
├── strategy_parser/
│   ├── __init__.py
│   ├── models.py                   # pydantic request/response models
│   ├── parser.py                   # deterministic parser logic
│   ├── service.py                  # FastAPI service wrapper
│   └── tests/
│       ├── __init__.py
│       └── test_parser.py          # pytest unit tests
├── validation/
│   ├── __init__.py
│   ├── models.py                   # pydantic models
│   ├── validator.py                # validation logic
│   ├── service.py                  # FastAPI service wrapper
│   └── tests/
│       ├── __init__.py
│       └── test_validator.py       # pytest unit tests
├── utils/
│   ├── __init__.py
│   ├── config.py                   # configuration management
│   ├── logger.py                   # logging setup
│   └── helpers.py                  # utility functions
└── tests/
    ├── __init__.py
    └── conftest.py                 # pytest fixtures
```

## Configuration

Set environment variables to customize behavior:

- `ENV`: Environment (development, production)
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- `NLP_BACKEND`: Parser backend (deterministic, huggingface, openai)
- `DEBUG`: Enable debug mode (true/false)
- `API_HOST`: API host (default: 0.0.0.0)
- `API_PORT`: API port (default: 8001)

## Supported Indicators

- RSI
- MACD
- SMA / EMA
- Volume
- Price
- Support / Resistance
- Stochastic
- ATR
- BollingerBand
- And more...

## Supported Operators

- `<` - Less than
- `>` - Greater than
- `<=` - Less than or equal
- `>=` - Greater than or equal
- `==` - Equal
- `!=` - Not equal

## Supported Actions

- `BUY` - Enter long position
- `SELL` - Exit or enter short position
- `HOLD` - No action

## Features

- ✅ Natural language parsing with deterministic fallback
- ✅ Comprehensive rule validation
- ✅ Logical conflict detection
- ✅ Risk scoring (0-100)
- ✅ Code generation from rules
- ✅ Request logging with UUIDs
- ✅ Structured error responses
- ✅ Full type hints
- ✅ Production-ready logging
- ✅ Unit test coverage

## Future Enhancements

- Real NLP models (HuggingFace, OpenAI)
- Advanced market data integration
- Backtesting engine integration
- Performance optimization
- Cloud deployment templates

## Notes

- All parsing is deterministic by default (no external API calls)
- Code generation does not execute code in the API process
- Validation includes security checks for code injection
- All user input is sanitized
