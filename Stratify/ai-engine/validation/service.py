"""Strategy validation service wrapper for FastAPI."""

import logging
from typing import Dict, Any, Optional

from .validator import StrategyValidator
# Return plain dicts for validation results (no Pydantic enforcement)

logger = logging.getLogger(__name__)


class StrategyValidatorService:
    """Wrapper service for strategy validation functionality."""
    
    def __init__(self):
        """Initialize validator service."""
        self.validator = StrategyValidator()
    
    def validate(
        self,
        rules,
        context: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Validate strategy rules.
        
        Args:
            rules: List of rule dicts
            context: Optional context with symbol, timeframe, initial_capital
            request_id: Optional request ID for logging
            
        Returns:
            ValidateStrategyResponse with validation results
        """
        request_id = request_id or "unknown"
        context = context or {}
        
        # Support both legacy list-of-rules and the new compact object
        if isinstance(rules, dict):
            # For compact specimens, call the main validator. 
            res = self.validator.validate(rules, context)
            if hasattr(res, "dict"):
                return res.dict()
            return dict(res)

        # Fallback: legacy list-of-rules path
        logger.info(f"[{request_id}] Validating {len(rules)} rules")

        # Convert rules to dicts if needed
        rule_dicts = []
        for rule in rules:
            if isinstance(rule, dict):
                rule_dicts.append(rule)
            else:
                # If it's a Pydantic model, convert to dict
                rule_dicts.append(rule.dict() if hasattr(rule, 'dict') else dict(rule))

        # Validate
        result = self.validator.validate(rule_dicts, context)

        # If validator returned a Pydantic model, convert to plain dict
        try:
            # Pydantic BaseModel has dict() method
            if hasattr(result, "dict"):
                out = result.dict()
            else:
                # Assume it's already a dict-like
                out = dict(result)
        except Exception:
            out = {"valid": False, "errors": ["Validation failure"], "warnings": [], "risk_score": 100.0, "suggested_changes": []}

        logger.info(f"[{request_id}] Validation completed: valid={out.get('valid')}, risk_score={out.get('risk_score')}")

        return out
