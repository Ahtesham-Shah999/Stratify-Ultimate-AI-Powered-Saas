"""Backtesting Module - Template Engine System

This module provides a complete backtesting infrastructure for validating trading
strategies using historical market data from MetaTrader5 and technical indicators
from pandas-ta.

## Architecture

### Core Components

1. **TemplateEngine** (`template_engine.py`)
   - Manages 5 indicator-based template scripts
   - `get_template(indicator: str) -> str`: Loads template file content
   - `fill_template(template: str, rules: dict) -> str`: Replaces placeholders
   - `generate(rules: dict) -> str`: Combined method (get + fill)

2. **BacktestingService** (`service.py`)
   - High-level wrapper around TemplateEngine
   - `generate_code(rules: dict) -> str`: End-to-end code generation
   - Handles logging and error management

3. **Templates** (`templates/`)
   - `rsi_template.py`: RSI indicator-based backtest
   - `sma_template.py`: SMA crossover-based backtest  
   - `macd_template.py`: MACD crossover-based backtest
   - `bollinger_template.py`: Bollinger Bands touch-based backtest
   - `stochastic_template.py`: Stochastic %K/%D crossover backtest

## Supported Indicators

| Indicator | Template File | Strategy |
|-----------|---------------|----------|
| **RSI** | `rsi_template.py` | Buy RSI < 30, Sell RSI > 70 |
| **SMA** | `sma_template.py` | Buy fast > slow, Sell fast < slow |
| **MACD** | `macd_template.py` | Buy MACD > signal, Sell MACD < signal |
| **BollingerBand** | `bollinger_template.py` | Buy price < lower, Sell price > upper |
| **Stochastic** | `stochastic_template.py` | Buy %K > %D, Sell %K < %D |

## Usage

### Basic Example

```python
from backtesting.service import BacktestingService

# Create service
service = BacktestingService()

# Define strategy rules
rules = {
    "pair": "EURUSD",
    "indicator": "RSI",
    "buy": "rsi < 30",
    "sell": "rsi > 70",
    "timeframe": "1h",
    "initial_capital": 10000,
    "stop_loss": None,
    "take_profit": None,
}

# Generate backtesting code
code = service.generate_code(rules)

# Save to file
with open("backtest_rsi.py", "w") as f:
    f.write(code)

# Execute
import subprocess
result = subprocess.run(["python", "backtest_rsi.py"], capture_output=True, text=True)
print(result.stdout)
```

### Using TemplateEngine Directly

```python
from backtesting.template_engine import TemplateEngine

engine = TemplateEngine()

# Get template for MACD
template = engine.get_template("MACD")

# Fill with rules
rules = {
    "pair": "BTCUSDT",
    "indicator": "MACD",
    "buy": "macd > signal",
    "sell": "macd < signal",
    "timeframe": "4h",
    "initial_capital": 50000,
}

code = engine.fill_template(template, rules)
```

## Template Placeholders

All templates use these placeholders that are replaced by TemplateEngine:

```python
SYMBOL = "{{SYMBOL}}"           # Trading pair (e.g., "EURUSD", "BTCUSDT")
TIMEFRAME = "{{TIMEFRAME}}"     # Candle timeframe (e.g., "1h", "4h", "1d")
INITIAL_CAPITAL = {{INITIAL_CAPITAL}}  # Starting capital (numeric)
BUY_CONDITION = "{{BUY_CONDITION}}"    # Buy logic as string
SELL_CONDITION = "{{SELL_CONDITION}}"  # Sell logic as string
```

## JSON Output Format

All templates produce structured JSON logs to stdout:

**Progress Log (every 500 candles):**
```json
{"type": "progress", "data": {"candle": 500, "total": 5000}}
```

**Trade Entry:**
```json
{"type": "trade", "data": {"action": "BUY", "price": 1.0823, "time": "2024-01-15 09:00", "profit": null}}
```

**Trade Exit:**
```json
{"type": "trade", "data": {"action": "SELL", "price": 1.0951, "time": "2024-01-21 14:00", "profit": 128.0}}
```

**Final Results:**
```json
{
  "type": "result",
  "data": {
    "profit_loss": 1240.5,
    "win_rate": 0.62,
    "max_drawdown": 0.15,
    "sharpe_ratio": 1.2,
    "trades_count": 45
  }
}
```

## Error Handling

### ValueError: Unsupported Indicator
Raised when an unsupported indicator is requested.
```python
try:
    engine.get_template("UNKNOWN")
except ValueError as e:
    print(e)  # "Indicator UNKNOWN is not supported. Supported indicators: RSI, SMA, ..."
```

### FileNotFoundError: Template Not Found
Raised when template file doesn't exist.
```python
try:
    engine.get_template("SMA")
except FileNotFoundError as e:
    print(e)  # "Template file not found: ..."
```

### KeyError: Missing Rules
Raised when required fields are missing from rules dict.
```python
rules = {"pair": "EURUSD"}  # Missing 'indicator'
engine.generate(rules)  # raises KeyError
```

## Dependencies

- `metatrader5`: MetaTrader5 Python client for market data
- `pandas`: Data manipulation and analysis
- `pandas-ta`: Technical analysis indicators
- `python-dotenv`: Environment variable management (from utils)
- `utils.logger`: Project logging utility

## Rules Dictionary Format

The `rules` dict passed to `generate_code()` should contain:

```python
{
    "pair": str,                  # Required: Trading pair (e.g., "EURUSD")
    "indicator": str,             # Required: Indicator name (RSI|SMA|MACD|BollingerBand|Stochastic)
    "buy": str,                   # Required: Buy condition (e.g., "rsi < 30")
    "sell": str,                  # Required: Sell condition (e.g., "rsi > 70")
    "timeframe": str,             # Required: Candle timeframe (e.g., "1h", "4h", "1d")
    "initial_capital": float|int, # Required: Starting capital (e.g., 10000)
    "stop_loss": float|null,      # Optional: Stop loss % (e.g., 0.02 for 2%)
    "take_profit": float|null,    # Optional: Take profit % (e.g., 0.05 for 5%)
}
```

## Example Modes

Run the example file to see all indicators in action:
```bash
python backtesting/example_usage.py
```

This will demonstrate:
- TemplateEngine usage
- BacktestingService usage
- Code generation for all 5 indicators

## Integration with AI Engine

The backtesting module integrates with the main strategy parser/validator:

1. **Parser** generates trading rules (pair, indicator, buy/sell conditions)
2. **Validator** checks the rules for logic/syntax errors
3. **BacktestingService** generates executable Python code from validated rules
4. **Generated code** can be run as a subprocess to backtest the strategy

## Notes

- Templates use MetaTrader5 APIs which require MT5 installation and/or connection to a broker
- Indicator calculations use `pandas-ta` library
- All timestamps in output are in format: "YYYY-MM-DD HH:MM"
- Profit/loss calculations are simplified for demo purposes; production use should implement actual position sizing, slippage, commissions, etc.
- Templates loop through up to 5000 candles; adjust in templates if needed for different data ranges
"""
