"""Strategy parser models and schemas using Pydantic."""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any


class ParseStrategyRequest(BaseModel):
    """Request model for strategy parsing endpoint."""
    user_id: str = Field(..., description="User identifier")
    language_input: str = Field(..., description="Natural language strategy description")
    symbol: Optional[str] = Field(None, description="Trading symbol (e.g., BTC, AAPL)")
    timeframe: Optional[str] = Field(None, description="Timeframe (e.g., 1h, 1d, 5m)")
    initial_capital: Optional[float] = Field(None, description="Initial capital amount")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": "user_123",
                "language_input": "Buy BTC when RSI < 30",
                "symbol": "BTC",
                "timeframe": "1h",
                "initial_capital": 10000
            }
        }
    )


class GeneratedRule(BaseModel):
    """Model for a generated trading rule."""
    indicator: str = Field(..., description="Indicator name (e.g., RSI, MA, Price)")
    operator: str = Field(..., description="Comparison operator (<, >, <=, >=, ==, !=)")
    value: float = Field(..., description="Comparison value")
    action: str = Field(..., description="Action (BUY, SELL, HOLD)")
    logic: Optional[str] = Field(None, description="Rule logic type (ENTRY, EXIT, FILTER)")
    confidence: float = Field(..., description="Confidence score 0-1", ge=0, le=1)
    group_id: Optional[int] = Field(None, description="Rule group ID for AND/OR logic")
    group_logic: Optional[str] = Field(None, description="Group logic (AND, OR)")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "indicator": "RSI",
                "operator": "<",
                "value": 30,
                "action": "BUY",
                "logic": "ENTRY",
                "confidence": 0.92,
                "group_id": None,
                "group_logic": None
            }
        }
    )


class ParseStrategyResponse(BaseModel):
    """Response model for strategy parsing endpoint."""
    # New top-level strategy spec fields to match user-provided structure
    owner_id: Optional[str] = Field(None, description="Original owner id if provided")
    name: Optional[str] = Field(None, description="Strategy name")
    description: Optional[str] = Field(None, description="Strategy description")
    language_input: Optional[str] = Field(None, description="Original natural language input")
    generated_rules: Dict[str, Any] = Field(..., description="Compact generated rules object (pair/indicator/buy/sell/...)")
    initial_capital: Optional[float] = Field(None, description="Initial capital amount")
    engine_type: Optional[str] = Field(None, description="Engine type, e.g., BACKTEST")
    visibility: Optional[str] = Field(None, description="Visibility: PUBLIC/PRIVATE")
    # Backwards-compatible metadata and warnings
    meta: Dict[str, Any] = Field(default_factory=dict, description="Strategy metadata")
    warnings: List[str] = Field(default_factory=list, description="Warning messages")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "owner_id": "675f1c97d3b4a9e192bf12cd",
                "name": "MACD Trend Strategy",
                "description": "A technical strategy based on MACD crossovers.",
                "language_input": "in BTCUSDT Buy when MACD crosses above signal line; sell when below.",
                "generated_rules": {
                    "pair": "BTCUSDT",
                    "indicator": "MACD",
                    "buy": "macd > signal",
                    "sell": "macd < signal",
                    "stop_loss": 0.02,
                    "take_profit": 0.05
                },
                "initial_capital": 10000,
                "engine_type": "BACKTEST",
                "visibility": "PUBLIC",
                "meta": {
                    "symbols": ["BTCUSDT"],
                    "timeframe": "1h",
                    "initial_capital": 10000
                },
                "warnings": []
            }
        }
    )
