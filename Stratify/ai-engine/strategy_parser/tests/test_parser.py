"""Unit tests for strategy parser."""

import pytest
from strategy_parser.parser import StrategyParser, generate_python_code
from strategy_parser.models import GeneratedRule


class TestStrategyParser:
    """Test cases for StrategyParser."""
    
    def test_parse_simple_buy_signal(self, parser):
        """Test parsing a simple buy signal."""
        language = "Buy BTC when RSI < 30"
        rules = parser.parse(language)
        
        assert len(rules) > 0
        rule = rules[0]
        assert rule.indicator == "RSI"
        assert rule.operator == "<"
        assert rule.value == 30
        assert rule.action == "BUY"
    
    def test_parse_sell_signal(self, parser):
        """Test parsing a sell signal."""
        language = "Sell when price > 50000"
        rules = parser.parse(language)
        
        assert len(rules) > 0
        rule = rules[0]
        assert rule.action == "SELL"
        assert rule.indicator == "Price"
        assert rule.value == 50000
    
    def test_parse_rsi_upper_threshold(self, parser):
        """Test parsing RSI upper threshold."""
        language = "Buy when RSI > 70"
        rules = parser.parse(language)
        
        assert len(rules) > 0
        rule = rules[0]
        assert rule.indicator == "RSI"
        assert rule.operator == ">"
        assert rule.value == 70
    
    def test_parse_volume_condition(self, parser):
        """Test parsing volume condition."""
        language = "Enter when volume >= 1000000"
        rules = parser.parse(language)
        
        assert len(rules) > 0
        rule = rules[0]
        assert rule.indicator == "Volume"
        assert rule.operator == ">="
        assert rule.value == 1000000
    
    def test_parse_multiple_sentences(self, parser):
        """Test parsing multiple rules from multiple sentences."""
        language = "Buy when RSI < 30. Sell when RSI > 70"
        rules = parser.parse(language)
        
        assert len(rules) >= 1
    
    def test_parse_with_context(self, parser, sample_context):
        """Test parsing with context."""
        language = "Buy when RSI < 30"
        rules = parser.parse(language, sample_context)
        
        assert len(rules) > 0
    
    def test_parse_empty_input(self, parser):
        """Test parsing empty input raises error."""
        with pytest.raises(ValueError):
            parser.parse("")
    
    def test_parse_invalid_input_type(self, parser):
        """Test parsing with invalid input type raises error."""
        with pytest.raises(ValueError):
            parser.parse(None)
    
    def test_rule_confidence_score(self, parser):
        """Test that parsed rules have confidence scores."""
        language = "Buy when RSI < 30"
        rules = parser.parse(language)
        
        assert len(rules) > 0
        for rule in rules:
            assert 0 <= rule.confidence <= 1
    
    def test_parse_macd_indicator(self, parser):
        """Test parsing MACD indicator."""
        language = "Buy when MACD < 100"
        rules = parser.parse(language)
        
        assert len(rules) > 0
        rule = rules[0]
        assert rule.indicator == "MACD"
    
    def test_parse_sma_indicator(self, parser):
        """Test parsing SMA indicator."""
        language = "Sell when SMA > 50000"
        rules = parser.parse(language)
        
        assert len(rules) > 0
        rule = rules[0]
        assert rule.indicator == "SMA"
    
    def test_fallback_parser(self, parser):
        """Test fallback parser for ambiguous input."""
        language = "Something confusing that matches buy RSI 25"
        rules = parser.parse(language)
        
        # Should still try to extract something
        # If nothing, should return empty but not crash
        assert isinstance(rules, list)


class TestCodeGeneration:
    """Test code generation from rules."""
    
    def test_generate_code_basic(self):
        """Test generating basic strategy code."""
        rules = [
            GeneratedRule(
                indicator="RSI",
                operator="<",
                value=30,
                action="BUY",
                logic="ENTRY",
                confidence=0.9,
            )
        ]
        
        code = generate_python_code(rules)
        assert "def strategy(data):" in code
        assert "RSI" in code
        assert "BUY" in code
    
    def test_generated_code_contains_function(self):
        """Test that generated code contains proper function."""
        rules = []
        code = generate_python_code(rules)
        
        assert "def strategy(data):" in code
        assert 'signal = "HOLD"' in code
    
    def test_generated_code_with_comments(self):
        """Test code generation with comments."""
        rules = [
            GeneratedRule(
                indicator="RSI",
                operator="<",
                value=30,
                action="BUY",
                logic="ENTRY",
                confidence=0.9,
            )
        ]
        
        code = generate_python_code(rules, include_comments=True)
        assert "#" in code
    
    def test_generated_code_without_comments(self):
        """Test code generation without comments."""
        rules = []
        code = generate_python_code(rules, include_comments=False)
        
        assert "auto-generated" not in code.lower()
