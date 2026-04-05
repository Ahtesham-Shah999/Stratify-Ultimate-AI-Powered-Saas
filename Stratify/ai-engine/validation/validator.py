"""Strategy validator implementation."""

import logging
import re
from typing import List, Dict, Any, Optional, Tuple

from .models import ValidateStrategyResponse, SuggestedChange
from utils.config import get_config
from utils.gemini_client import call_gemini
import json

config = get_config()

logger = logging.getLogger(__name__)


class StrategyValidator:
    """
    Validates trading strategies for syntax, semantics, and risk.
    
    Performs comprehensive checks including:
    - Syntax validation
    - Indicator availability checks
    - Logical conflict detection
    - Risk assessment
    """
    
    # Known indicators
    KNOWN_INDICATORS = {
        "RSI", "MACD", "SMA", "EMA", "Volume", "Price", "Support",
        "Resistance", "Stochastic", "ATR", "BollingerBand", "BBW",
        "VWAP", "Momentum", "Rate", "CCI", "ADX", "KDJ"
    }
    
    # Valid operators
    VALID_OPERATORS = {"<", ">", "<=", ">=", "==", "!="}
    
    # Valid actions
    VALID_ACTIONS = {"BUY", "SELL", "HOLD"}
    
    # Valid logic types
    VALID_LOGIC_TYPES = {"ENTRY", "EXIT", "FILTER"}
    
    def validate(
        self,
        rules: List[Dict[str, Any]],
        context: Optional[Dict[str, Any]] = None,
    ) -> ValidateStrategyResponse:
        """
        Validate trading rules.
        
        Args:
            rules: List of rule dicts with indicator, operator, value, action
            context: Optional context with symbol, timeframe, initial_capital
            
        Returns:
            ValidateStrategyResponse with validation results
        """
        context = context or {}
        # Use Gemini-only validation as requested (no fallback)
        return self._validate_with_gemini(rules, context)
        errors = []
        warnings = []
        suggested_changes = []
        risk_score = 0.0
        
        # Check basic validity
        if not isinstance(rules, list):
            errors.append("Rules must be a list")
            return ValidateStrategyResponse(
                valid=False,
                errors=errors,
                warnings=warnings,
                risk_score=100,
                suggested_changes=suggested_changes,
            )
        
        if len(rules) == 0:
            warnings.append("No rules provided")
        
        # Validate each rule
        for i, rule in enumerate(rules):
            rule_errors, rule_warnings, rule_changes, rule_risk = self._validate_rule(
                rule, i, context
            )
            errors.extend(rule_errors)
            warnings.extend(rule_warnings)
            suggested_changes.extend(rule_changes)
            risk_score += rule_risk
        
        # Check for logical conflicts
        conflict_errors, conflict_changes = self._check_logical_conflicts(rules)
        errors.extend(conflict_errors)
        suggested_changes.extend(conflict_changes)
        
        # Check for risk issues
        risk_errors, risk_warnings = self._check_risk_limits(rules, context)
        errors.extend(risk_errors)
        warnings.extend(risk_warnings)
        
        # Calculate final risk score
        risk_score = self._calculate_risk_score(errors, warnings, rules, context)
        
        # Determine validity
        valid = len(errors) == 0
        
        logger.info(f"Validation complete: valid={valid}, risk_score={risk_score}")
        
        return ValidateStrategyResponse(
            valid=valid,
            errors=errors,
            warnings=warnings,
            risk_score=risk_score,
            suggested_changes=suggested_changes,
        )

    def _validate_with_gemini(self, rules: List[Dict[str, Any]], context: Dict[str, Any]) -> ValidateStrategyResponse:
        """
        Use Gemini model to validate parsed JSON rules. The model is given a prompt
        that specifies which indicators are available and the expected output JSON schema.
        The model should return JSON with either valid=true or valid=false and details.
        """
        model = getattr(config, "GENAI_MODEL", "gemini-2.0-flash")

        prompt = (
            "You are a professional trading strategy validator. Validate trading rules and return ONLY valid JSON with NO explanations or text outside JSON.\n\n"
            "VALIDATION RULES:\n"
            "1. indicator MUST be from known indicators list (provided below). \n"
            "   → COMPOSITES (e.g., `rsi_macd`) are VALID if each part is known.\n"
            "2. operator MUST be: <, >, <=, >=, ==, != (or part of a clear buy/sell expression)\n"
            "3. action MUST be: BUY, SELL, or HOLD (uppercase)\n"
            "4. value MUST be numeric or part of a valid expression\n"
            "5. confidence MUST be 0 to 1 (decimal)\n"
            "6. Check for logical contradictions\n"
            "SCORING:\n"
            "- Base: risk_score = 10\n"
            "- Add 20 per error\n"
            "- Add 10 per warning\n"
            "- Cap at 100 max\n\n"
            "JSON SCHEMA:\n"
            '{"valid": true/false, "errors": [...], "warnings": [...], "risk_score": 0-100, "suggested_changes": [{"path": "...", "suggestion": "..."}]}\n\n'
            "EXAMPLE 1 (VALID):\n"
            "INPUT: {\"generated_rules\": [{\"indicator\": \"RSI\", \"operator\": \"<\", \"value\": 30, \"action\": \"BUY\", \"confidence\": 0.9}]}\n"
            "OUTPUT: {\"valid\": true, \"errors\": [], \"warnings\": [], \"risk_score\": 10.0, \"suggested_changes\": []}\n\n"
            "EXAMPLE 2 (INVALID - unknown indicator):\n"
            "INPUT: {\"generated_rules\": [{\"indicator\": \"UNKNOWN\", \"operator\": \"<\", \"value\": 30, \"action\": \"BUY\", \"confidence\": 0.3}]}\n"
            "OUTPUT: {\"valid\": false, \"errors\": [\"Indicator UNKNOWN is not in the list of known indicators\"], \"warnings\": [\"Confidence 0.3 is low\"], \"risk_score\": 50.0, \"suggested_changes\": [{\"path\": \"/generated_rules[0]/indicator\", \"suggestion\": \"Use a known indicator\"}]}\n\n"
            "EXAMPLE 3 (WARNING - out of range):\n"
            "INPUT: {\"generated_rules\": [{\"indicator\": \"RSI\", \"operator\": \"<\", \"value\": 150, \"action\": \"BUY\", \"confidence\": 0.9}]}\n"
            "OUTPUT: {\"valid\": true, \"errors\": [], \"warnings\": [\"RSI value 150 is outside normal range 0-100\"], \"risk_score\": 20.0, \"suggested_changes\": [{\"path\": \"/generated_rules[0]/value\", \"suggestion\": \"RSI should be 0-100\"}]}\n\n"
            "CRITICAL:\n"
            "1. Return ONLY JSON\n"
            "2. valid is boolean (true or false)\n"
            "3. Errors make valid=false\n"
            "4. Warnings do NOT make valid=false but increase risk_score\n"
            "5. If no rules provided, warning message but valid=true"
        )

        indicators_list = sorted(list(self.KNOWN_INDICATORS))
        messages = [
            {"role": "user", "content": prompt + "\n\nKnown indicators:\n" + ", ".join(indicators_list) + "\n\nParsed JSON:\n" + json.dumps({"generated_rules": rules, "meta": context}, default=str)}
        ]

        resp = call_gemini(model, messages)
        if resp.get("error"):
            raise RuntimeError(f"Gemini API error: {resp['error']}")

        parsed = resp.get("json")
        text = resp.get("text", "")
        if parsed is None:
            # try extract JSON substring
            try:
                start = text.find("{")
                end = text.rfind("}")
                if start != -1 and end != -1:
                    parsed = json.loads(text[start:end+1])
            except Exception:
                parsed = None

        if not parsed:
            raise RuntimeError("Gemini did not return valid JSON for validation")

        # Build ValidateStrategyResponse defensively
        return ValidateStrategyResponse(
            valid=bool(parsed.get("valid", False)),
            errors=parsed.get("errors", []),
            warnings=parsed.get("warnings", []),
            risk_score=float(parsed.get("risk_score", 100.0)),
            suggested_changes=[SuggestedChange(**s) for s in parsed.get("suggested_changes", [])],
        )
    
    def _validate_rule(
        self,
        rule: Dict[str, Any],
        index: int,
        context: Dict[str, Any],
    ) -> Tuple[List[str], List[str], List[SuggestedChange], float]:
        """
        Validate a single rule.
        
        Returns: (errors, warnings, suggested_changes, risk_score)
        """
        errors = []
        warnings = []
        suggested_changes = []
        risk = 0.0
        path = f"generated_rules[{index}]"
        
        # Check required fields
        required_fields = ["indicator", "operator", "value", "action"]
        for field in required_fields:
            if field not in rule:
                errors.append(f"{path}: Missing required field '{field}'")
        
        if errors:
            return errors, warnings, suggested_changes, 30.0
        
        # Validate indicator
        indicator = rule.get("indicator")
        if indicator not in self.KNOWN_INDICATORS:
            warnings.append(f"{path}: Unknown indicator '{indicator}'")
            risk += 10.0
        
        # Validate operator
        operator = rule.get("operator")
        if operator not in self.VALID_OPERATORS:
            errors.append(f"{path}: Invalid operator '{operator}'")
            risk += 25.0
        
        # Validate value
        try:
            value = float(rule.get("value", 0))
            if indicator == "RSI" and (value < 0 or value > 100):
                warnings.append(f"{path}: RSI value {value} outside range 0-100")
                risk += 15.0
        except (ValueError, TypeError):
            errors.append(f"{path}: Value must be numeric")
            risk += 25.0
        
        # Validate action
        action = rule.get("action")
        if action not in self.VALID_ACTIONS:
            errors.append(f"{path}: Invalid action '{action}'. Must be BUY, SELL, or HOLD")
            risk += 25.0
        
        # Validate logic type if present
        logic = rule.get("logic")
        if logic and logic not in self.VALID_LOGIC_TYPES:
            warnings.append(f"{path}: Invalid logic type '{logic}'")
            risk += 10.0
        
        # Check confidence score
        confidence = rule.get("confidence", 1.0)
        if confidence is not None:
            if not (0 <= confidence <= 1):
                warnings.append(f"{path}: Confidence {confidence} outside range 0-1")
                risk += 5.0
            elif confidence < 0.5:
                warnings.append(f"{path}: Low confidence score {confidence}")
                risk += 10.0
        
        return errors, warnings, suggested_changes, risk
    
    def _check_logical_conflicts(
        self,
        rules: List[Dict[str, Any]],
    ) -> Tuple[List[str], List[SuggestedChange]]:
        """
        Check for contradictory rules that cannot both be true.
        
        Returns: (errors, suggested_changes)
        """
        errors = []
        suggested_changes = []
        
        # Look for same indicator with conflicting operators
        indicators_by_index = {}
        for i, rule in enumerate(rules):
            indicator = rule.get("indicator")
            if indicator:
                if indicator not in indicators_by_index:
                    indicators_by_index[indicator] = []
                indicators_by_index[indicator].append((i, rule))
        
        # Check for conflicts
        for indicator, occurrences in indicators_by_index.items():
            if len(occurrences) > 1:
                # Check for logical impossibilities
                for i, (idx1, rule1) in enumerate(occurrences):
                    for idx2, rule2 in occurrences[i + 1:]:
                        conflict = self._detect_conflict(rule1, rule2)
                        if conflict:
                            errors.append(
                                f"Contradictory rules: {indicator} at indices "
                                f"[{idx1}] and [{idx2}] - {conflict}"
                            )
                            suggested_changes.append(
                                SuggestedChange(
                                    path=f"generated_rules[{idx2}]",
                                    suggestion=f"Review rule logic or split into separate conditions"
                                )
                            )
        
        return errors, suggested_changes
    
    def _detect_conflict(self, rule1: Dict[str, Any], rule2: Dict[str, Any]) -> Optional[str]:
        """
        Detect if two rules are logically impossible together.
        
        Examples:
            RSI < 30 AND RSI > 70 → conflict
            Price > 100 AND Price < 50 → conflict
        """
        op1 = rule1.get("operator")
        op2 = rule2.get("operator")
        val1 = rule1.get("value")
        val2 = rule2.get("value")
        logic = rule1.get("group_logic", "AND")
        
        if logic != "AND":
            return None  # OR logic allows conflicts
        
        try:
            val1 = float(val1)
            val2 = float(val2)
        except (ValueError, TypeError):
            return None
        
        # Check for impossible AND conditions
        if op1 == "<" and op2 == ">" and val1 <= val2:
            return f"{op1} {val1} AND {op2} {val2} is impossible"
        
        if op1 == "<" and op2 == ">" and val1 > val2:
            return f"{op1} {val1} AND {op2} {val2} cannot both be true"
        
        if op1 == ">" and op2 == "<" and val1 >= val2:
            return f"{op1} {val1} AND {op2} {val2} is impossible"
        
        return None
    
    def _check_risk_limits(
        self,
        rules: List[Dict[str, Any]],
        context: Dict[str, Any],
    ) -> Tuple[List[str], List[str]]:
        """
        Check position sizing and capital allocation risks.
        
        Returns: (errors, warnings)
        """
        errors = []
        warnings = []
        
        initial_capital = context.get("initial_capital", 0)
        timeframe = context.get("timeframe", "")
        
        if initial_capital <= 0:
            warnings.append("No initial capital specified")
            return errors, warnings
        
        # Check for risky volume thresholds on tight timeframes
        if timeframe in ["1m", "5m", "15m"]:
            for rule in rules:
                if rule.get("indicator") == "Volume":
                    value = rule.get("value", 0)
                    if value < 100000:
                        warnings.append(
                            f"Volume threshold {value} very low for {timeframe} timeframe"
                        )
        
        # If position sizing info is available (could be in future rules)
        # Check that implied position size doesn't exceed capital
        
        return errors, warnings
    
    def _calculate_risk_score(
        self,
        errors: List[str],
        warnings: List[str],
        rules: List[Dict[str, Any]],
        context: Dict[str, Any],
    ) -> float:
        """
        Calculate overall risk score (0-100) based on issues and strategy complexity.
        """
        risk_score = 0.0
        
        # Errors are critical: each adds 30 points
        risk_score += len(errors) * 30
        
        # Warnings: each adds 10 points
        risk_score += len(warnings) * 10
        
        # Rule complexity
        if len(rules) > 10:
            risk_score += 15  # Complex strategies are riskier
        
        # No rules = high risk
        if len(rules) == 0:
            risk_score += 50
        
        # Confidence check
        avg_confidence = 0.0
        for rule in rules:
            conf = rule.get("confidence", 1.0)
            if conf is not None:
                avg_confidence += conf
        
        if len(rules) > 0:
            avg_confidence /= len(rules)
            if avg_confidence < 0.6:
                risk_score += 20
        
        # Cap at 100
        return min(100.0, risk_score)
