"""Example usage of TemplateEngine and BacktestingService.

This module demonstrates how to use the backtesting infrastructure to
generate and execute trading strategy backtests.
"""

from backtesting.template_engine import TemplateEngine
from backtesting.service import BacktestingService


def example_template_engine():
    """Show TemplateEngine usage."""
    print("=== TemplateEngine Example ===\n")
    
    engine = TemplateEngine()
    
    # Example: Get RSI template and fill it
    template = engine.get_template("RSI")
    print(f"RSI template size: {len(template)} characters\n")
    
    # Define strategy rules
    rules = {
        "pair": "EURUSD",
        "timeframe": "1h",
        "initial_capital": 10000,
        "buy": "rsi < 30",
        "sell": "rsi > 70",
    }
    
    # Fill template with rules
    filled_code = engine.fill_template(template, rules)
    print(f"Filled code size: {len(filled_code)} characters")
    print("\nFirst 500 chars of filled code:")
    print(filled_code[:500] + "...\n")


def example_backtesting_service():
    """Show BacktestingService usage."""
    print("=== BacktestingService Example ===\n")
    
    service = BacktestingService()
    
    # Define strategy rules
    rules = {
        "pair": "BTCUSDT",
        "indicator": "MACD",
        "buy": "macd > signal",
        "sell": "macd < signal",
        "timeframe": "4h",
        "initial_capital": 50000,
        "stop_loss": None,
        "take_profit": None,
    }
    
    # Generate backtesting code
    code = service.generate_code(rules)
    
    print(f"Generated {len(code)} characters of backtesting code")
    print(f"Strategy: {rules['indicator']} on {rules['pair']} ({rules['timeframe']})")
    print(f"Initial capital: ${rules['initial_capital']}\n")
    
    # In a real scenario, you could save and execute the code:
    # with open("backtest_macd_btc.py", "w") as f:
    #     f.write(code)
    # 
    # Then run:
    # python backtest_macd_btc.py


def example_all_indicators():
    """Show generation for all supported indicators."""
    print("=== All Supported Indicators ===\n")
    
    service = BacktestingService()
    
    # Template rules for different indicators
    templates_specs = [
        {
            "pair": "EURUSD",
            "indicator": "RSI",
            "buy": "rsi < 30",
            "sell": "rsi > 70",
            "timeframe": "1h",
            "initial_capital": 10000,
        },
        {
            "pair": "GBPUSD",
            "indicator": "SMA",
            "buy": "sma_fast > sma_slow",
            "sell": "sma_fast < sma_slow",
            "timeframe": "4h",
            "initial_capital": 20000,
        },
        {
            "pair": "EURUSD",
            "indicator": "MACD",
            "buy": "macd > signal",
            "sell": "macd < signal",
            "timeframe": "1d",
            "initial_capital": 15000,
        },
        {
            "pair": "BTCUSDT",
            "indicator": "BollingerBand",
            "buy": "price < lower_band",
            "sell": "price > upper_band",
            "timeframe": "1h",
            "initial_capital": 50000,
        },
        {
            "pair": "AUDUSD",
            "indicator": "Stochastic",
            "buy": "stoch_k > stoch_d",
            "sell": "stoch_k < stoch_d",
            "timeframe": "4h",
            "initial_capital": 5000,
        },
    ]
    
    for spec in templates_specs:
        try:
            code = service.generate_code(spec)
            status = "✓"
            size = len(code)
        except Exception as e:
            status = "✗"
            size = 0
        
        print(
            f"{status} {spec['indicator']:15} on {spec['pair']:10} "
            f"({spec['timeframe']:3}) - {size:,} bytes"
        )


if __name__ == "__main__":
    example_template_engine()
    print("\n" + "="*60 + "\n")
    example_backtesting_service()
    print("\n" + "="*60 + "\n")
    example_all_indicators()
