"""Validation models and schemas using Pydantic."""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional, Union


class ValidateStrategyRequest(BaseModel):
    """Request model for strategy validation endpoint."""
    strategy_id: Optional[str] = Field(None, description="Strategy identifier")
    # generated_rules may be either the old list-of-rules format or the new compact object
    generated_rules: Union[List[Dict[str, Any]], Dict[str, Any]] = Field(..., description="Generated rules to validate")
    symbol: Optional[str] = Field(None, description="Trading symbol")
    timeframe: Optional[str] = Field(None, description="Timeframe (e.g., 1h, 1d)")
    initial_capital: Optional[float] = Field(None, description="Initial capital amount")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "strategy_id": "strat_abc123",
                "generated_rules": [
                    {
                        "indicator": "RSI",
                        "operator": "<",
                        "value": 30,
                        "action": "BUY",
                        "logic": "ENTRY",
                        "confidence": 0.92,
                    }
                ],
                "symbol": "BTC",
                "timeframe": "1h",
                "initial_capital": 10000,
            }
        }
    )


class SuggestedChange(BaseModel):
    """Suggested change for a rule."""
    path: str = Field(..., description="Path to the rule (e.g., 'generated_rules[0]')")
    suggestion: str = Field(..., description="Suggested change")


class ValidateStrategyResponse(BaseModel):
    """Response model for strategy validation endpoint."""
    valid: bool = Field(..., description="Whether strategy is valid")
    errors: List[str] = Field(default_factory=list, description="Validation errors")
    warnings: List[str] = Field(default_factory=list, description="Warnings")
    risk_score: float = Field(..., description="Risk score 0-100", ge=0, le=100)
    suggested_changes: List[SuggestedChange] = Field(
        default_factory=list,
        description="Suggested improvements"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "valid": False,
                "errors": [
                    "Contradictory rules: RSI < 30 AND RSI > 70 with logic AND"
                ],
                "warnings": [
                    "Volume threshold very low for 1m timeframe",
                    "Position size exceeds 50% of capital",
                ],
                "risk_score": 67,
                "suggested_changes": [
                    {
                        "path": "generated_rules[1]",
                        "suggestion": "Change operator >70 to >=70 or split rule group",
                    }
                ],
            }
        }
    )
