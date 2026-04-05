"""Template Engine for dynamic backtesting code generation.

This module provides the TemplateEngine class which manages indicator templates
and generates customized backtesting Python scripts by replacing placeholders
with actual strategy parameters.
"""

import os
from typing import Dict, Any
from utils.logger import get_logger

logger = get_logger(__name__)


class TemplateEngine:
    """Manages trading strategy backtesting templates and code generation.
    
    Supported indicators:
    - RSI: Relative Strength Index
    - SMA: Simple Moving Average crossover
    - MACD: Moving Average Convergence Divergence
    - BollingerBand: Bollinger Bands
    - Stochastic: Stochastic %K/%D crossover
    """
    
    SUPPORTED_INDICATORS = {
        "RSI": "rsi_template.py",
        "SMA": "sma_template.py",
        "MACD": "macd_template.py",
        "BOLLINGERBAND": "bollinger_template.py",
        "STOCHASTIC": "stochastic_template.py",
    }
    
    def __init__(self):
        """Initialize TemplateEngine with path to templates folder."""
        self.templates_dir = os.path.join(
            os.path.dirname(__file__),
            "templates"
        )
        logger.info(f"TemplateEngine initialized with templates at: {self.templates_dir}")
    
    def get_template(self, indicator: str) -> str:
        """Read and return template file content for a given indicator.
        
        Args:
            indicator: Indicator name (case-insensitive).
                      Must be one of: RSI, SMA, MACD, BOLLINGERBAND, STOCHASTIC
        
        Returns:
            str: Raw template file content with placeholders.
            
        Raises:
            ValueError: If indicator is not supported.
            FileNotFoundError: If template file does not exist.
        """
        # Normalize indicator name for lookup
        indicator_upper = indicator.upper().replace(" ", "")
        
        # Handle alias mappings
        if indicator_upper == "BOLLINGER" or indicator_upper == "BOLLINGERBANDS":
            indicator_upper = "BOLLINGERBAND"
        if indicator_upper == "EMA":
            indicator_upper = "SMA"
        
        if indicator_upper not in self.SUPPORTED_INDICATORS:
            supported = ", ".join(self.SUPPORTED_INDICATORS.keys())
            raise ValueError(
                f"Indicator {indicator} is not supported. "
                f"Supported indicators: {supported}"
            )
        
        template_filename = self.SUPPORTED_INDICATORS[indicator_upper]
        template_path = os.path.join(self.templates_dir, template_filename)
        
        if not os.path.exists(template_path):
            raise FileNotFoundError(f"Template file not found: {template_path}")
        
        with open(template_path, "r") as f:
            content = f.read()
        
        logger.debug(f"Loaded template for {indicator} from {template_path}")
        return content
    
    def fill_template(self, template: str, rules: Dict[str, Any]) -> str:
        """Replace all {{PLACEHOLDER}} values in template with actual values.
        
        Template expects these keys in rules:
        - pair or symbol: Trading pair/symbol (e.g., "BTCUSDT", "EURUSD")
        - timeframe: Candlestick timeframe (e.g., "1h", "4h", "1d")
        - initial_capital: Starting capital (numeric)
        - buy: Buy condition as string (e.g., "rsi < 30")
        - sell: Sell condition as string (e.g., "rsi > 70")
        
        Args:
            template: Raw template string with {{PLACEHOLDER}} markers.
            rules: Dict with strategy parameters.
        
        Returns:
            str: Filled template with all placeholders replaced.
        """
        filled = template
        
        # Extract parameter values from rules
        symbol = rules.get("pair") or rules.get("symbol", "EURUSD")
        timeframe = rules.get("timeframe", "1h")
        initial_capital = rules.get("initial_capital", 10000)
        buy_condition = rules.get("buy", "")
        buy_condition = rules.get("buy", "")
        sell_condition = rules.get("sell", "")
        start_date = rules.get("start_date")
        end_date = rules.get("end_date")
        
        # Perform replacements
        replacements = {
            "{{SYMBOL}}": str(symbol),
            "{{TIMEFRAME}}": str(timeframe),
            "{{INITIAL_CAPITAL}}": str(initial_capital),
            "{{BUY_CONDITION}}": str(buy_condition),
            "{{SELL_CONDITION}}": str(sell_condition),
            "{{START_DATE}}": str(start_date) if start_date else "None",
            "{{END_DATE}}": str(end_date) if end_date else "None",
        }
        
        for placeholder, value in replacements.items():
            filled = filled.replace(placeholder, value)
        
        logger.debug(f"Filled template with rules: {rules}")
        return filled
    
    def generate(self, rules: Dict[str, Any]) -> str:
        """Generate complete backtesting Python code from strategy rules.
        
        Combines get_template() and fill_template() to produce a ready-to-run
        backtesting script.
        
        Args:
            rules: Strategy specification dict with keys:
                - pair/symbol: Trading pair
                - indicator: Indicator name
                - buy: Buy condition
                - sell: Sell condition
                - stop_loss: Stop loss (optional, numeric or null)
                - take_profit: Take profit (optional, numeric or null)
                - timeframe: Candlestick timeframe
                - initial_capital: Starting capital
        
        Returns:
            str: Complete Python backtesting script.
            
        Raises:
            ValueError: If indicator is not supported.
            KeyError: If required keys are missing from rules.
        """
        indicator = rules.get("indicator")
        if not indicator:
            raise ValueError("'indicator' field is required in rules")
        
        # Get appropriate template
        template = self.get_template(indicator)
        
        # Fill with actual values
        filled = self.fill_template(template, rules)
        
        logger.info(f"Generated backtesting code for {indicator} strategy")
        return filled
