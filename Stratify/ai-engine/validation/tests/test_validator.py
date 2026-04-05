"""Unit tests for strategy validator."""

import pytest
from validation.validator import StrategyValidator


class TestStrategyValidator:
    """Test cases for StrategyValidator."""
    
    def test_validate_valid_rule(self, validator, sample_rule, sample_context):
        """Test validation of a valid rule."""
        result = validator.validate([sample_rule], sample_context)
        
        assert result.valid is True
        assert len(result.errors) == 0
    
    def test_validate_missing_required_field(self, validator, sample_context):
        """Test validation detects missing required fields."""
        incomplete_rule = {
            "indicator": "RSI",
            "operator": "<",
            # Missing value and action
        }
        
        result = validator.validate([incomplete_rule], sample_context)
        
        assert result.valid is False
        assert len(result.errors) > 0
    
    def test_validate_invalid_operator(self, validator, sample_context):
        """Test validation detects invalid operator."""
        invalid_rule = {
            "indicator": "RSI",
            "operator": "???",
            "value": 30,
            "action": "BUY",
        }
        
        result = validator.validate([invalid_rule], sample_context)
        
        assert result.valid is False
        assert any("operator" in e.lower() for e in result.errors)
    
    def test_validate_invalid_action(self, validator, sample_context):
        """Test validation detects invalid action."""
        invalid_rule = {
            "indicator": "RSI",
            "operator": "<",
            "value": 30,
            "action": "INVALID",
        }
        
        result = validator.validate([invalid_rule], sample_context)
        
        assert result.valid is False
        assert any("action" in e.lower() for e in result.errors)
    
    def test_validate_rsi_value_out_of_range(self, validator, sample_context):
        """Test validation warns about RSI out of range."""
        rule = {
            "indicator": "RSI",
            "operator": "<",
            "value": 150,  # Invalid: RSI is 0-100
            "action": "BUY",
        }
        
        result = validator.validate([rule], sample_context)
        
        assert len(result.warnings) > 0
    
    def test_validate_conflicting_rules(self, validator, conflicting_rules, sample_context):
        """Test validation detects contradictory rules."""
        result = validator.validate(conflicting_rules, sample_context)
        
        # Should have warnings or errors about conflict
        assert len(result.errors) > 0 or len(result.warnings) > 0
    
    def test_validate_low_confidence_warning(self, validator, sample_context):
        """Test validation warns about low confidence."""
        rule = {
            "indicator": "RSI",
            "operator": "<",
            "value": 30,
            "action": "BUY",
            "confidence": 0.3,
        }
        
        result = validator.validate([rule], sample_context)
        
        assert len(result.warnings) > 0
    
    def test_validate_no_rules_warning(self, validator, sample_context):
        """Test validation warns when no rules provided."""
        result = validator.validate([], sample_context)
        
        assert len(result.warnings) > 0
    
    def test_validate_risk_score_computed(self, validator, sample_rule, sample_context):
        """Test that risk score is computed."""
        result = validator.validate([sample_rule], sample_context)
        
        assert isinstance(result.risk_score, float)
        assert 0 <= result.risk_score <= 100
    
    def test_validate_empty_value_raises_error(self, validator, sample_context):
        """Test validation with non-numeric value."""
        rule = {
            "indicator": "RSI",
            "operator": "<",
            "value": "not_a_number",
            "action": "BUY",
        }
        
        result = validator.validate([rule], sample_context)
        
        assert result.valid is False
    
    def test_validate_unknown_indicator_warning(self, validator, sample_context):
        """Test validation warns about unknown indicators."""
        rule = {
            "indicator": "UNKNOWN_INDICATOR",
            "operator": "<",
            "value": 30,
            "action": "BUY",
        }
        
        result = validator.validate([rule], sample_context)
        
        assert len(result.warnings) > 0
    
    def test_validate_multiple_rules(self, validator, sample_context):
        """Test validation of multiple rules."""
        rules = [
            {
                "indicator": "RSI",
                "operator": "<",
                "value": 30,
                "action": "BUY",
            },
            {
                "indicator": "MACD",
                "operator": ">",
                "value": 100,
                "action": "SELL",
            },
        ]
        
        result = validator.validate(rules, sample_context)
        
        assert isinstance(result, object)
        assert hasattr(result, 'valid')
        assert hasattr(result, 'risk_score')
    
    def test_validate_suggested_changes(self, validator, conflicting_rules, sample_context):
        """Test that validator provides suggested changes."""
        result = validator.validate(conflicting_rules, sample_context)
        
        # Conflicting rules might suggest changes
        assert isinstance(result.suggested_changes, list)
    
    def test_risk_score_increases_with_errors(self, validator, sample_context):
        """Test that risk score increases with validation errors."""
        valid_rule = {
            "indicator": "RSI",
            "operator": "<",
            "value": 30,
            "action": "BUY",
        }
        
        result_valid = validator.validate([valid_rule], sample_context)
        
        invalid_rule = {
            "indicator": "RSI",
            "operator": "???",
            "value": 30,
            "action": "INVALID",
        }
        
        result_invalid = validator.validate([invalid_rule], sample_context)
        
        assert result_invalid.risk_score > result_valid.risk_score


class TestLogicalConflictDetection:
    """Test logical conflict detection."""
    
    def test_detect_rsi_contradiction(self, validator):
        """Test detection of impossible RSI conditions."""
        rule1 = {
            "indicator": "RSI",
            "operator": "<",
            "value": 30,
            "action": "BUY",
            "group_logic": "AND",
        }
        rule2 = {
            "indicator": "RSI",
            "operator": ">",
            "value": 70,
            "action": "SELL",
            "group_logic": "AND",
        }
        
        result = validator.validate([rule1, rule2], {})
        
        # Should detect conflict
        assert len(result.errors) > 0 or len(result.warnings) > 0
    
    def test_no_conflict_with_or_logic(self, validator):
        """Test that OR logic doesn't produce conflict errors."""
        rule1 = {
            "indicator": "RSI",
            "operator": "<",
            "value": 30,
            "action": "BUY",
            "group_logic": "OR",
        }
        rule2 = {
            "indicator": "RSI",
            "operator": ">",
            "value": 70,
            "action": "SELL",
            "group_logic": "OR",
        }
        
        result = validator.validate([rule1, rule2], {})
        
        # OR logic allows both conditions
        assert all("contradiction" not in e.lower() for e in result.errors)
