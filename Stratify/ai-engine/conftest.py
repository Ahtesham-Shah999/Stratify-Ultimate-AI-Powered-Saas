"""Pytest fixtures and configuration for root directory."""

import pytest
import sys
from pathlib import Path
from typing import Dict, Any

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from strategy_parser.parser import StrategyParser
from validation.validator import StrategyValidator


@pytest.fixture
def parser() -> StrategyParser:
    """Fixture providing a StrategyParser instance."""
    return StrategyParser()


@pytest.fixture
def validator() -> StrategyValidator:
    """Fixture providing a StrategyValidator instance."""
    return StrategyValidator()


@pytest.fixture
def sample_context() -> Dict[str, Any]:
    """Fixture providing sample context."""
    return {
        "symbol": "BTC",
        "timeframe": "1h",
        "initial_capital": 10000.0,
    }


@pytest.fixture
def sample_rule() -> Dict[str, Any]:
    """Fixture providing a sample trading rule."""
    return {
        "indicator": "RSI",
        "operator": "<",
        "value": 30,
        "action": "BUY",
        "logic": "ENTRY",
        "confidence": 0.92,
    }


@pytest.fixture
def conflicting_rules() -> list:
    """Fixture providing conflicting rules."""
    return [
        {
            "indicator": "RSI",
            "operator": "<",
            "value": 30,
            "action": "BUY",
            "logic": "ENTRY",
            "confidence": 0.9,
            "group_logic": "AND",
        },
        {
            "indicator": "RSI",
            "operator": ">",
            "value": 70,
            "action": "SELL",
            "logic": "EXIT",
            "confidence": 0.9,
            "group_logic": "AND",
        },
    ]
