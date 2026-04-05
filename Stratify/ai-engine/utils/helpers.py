"""Helper utilities."""

import re
from typing import Optional, Union, Dict, Any


OPERATOR_MAP = {
    "<": lambda a, b: a < b,
    ">": lambda a, b: a > b,
    "<=": lambda a, b: a <= b,
    ">=": lambda a, b: a >= b,
    "==": lambda a, b: a == b,
    "!=": lambda a, b: a != b,
}


def safe_float_convert(value: Any) -> Optional[float]:
    """
    Safely convert a value to float.
    
    Args:
        value: Value to convert
        
    Returns:
        Float value or None if conversion fails
    """
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def safe_int_convert(value: Any) -> Optional[int]:
    """
    Safely convert a value to integer.
    
    Args:
        value: Value to convert
        
    Returns:
        Integer value or None if conversion fails
    """
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def evaluate_condition(
    value: float,
    operator: str,
    threshold: float,
) -> bool:
    """Evaluate a condition safely."""
    if operator not in OPERATOR_MAP:
        raise ValueError(f"Invalid operator: {operator}")
    
    try:
        return OPERATOR_MAP[operator](value, threshold)
    except Exception as e:
        raise ValueError(f"Error evaluating condition: {str(e)}")


def sanitize_text(text: str, max_length: int = 10000) -> str:
    """
    Sanitize text input to prevent injection attacks.
    
    Args:
        text: Text to sanitize
        max_length: Maximum allowed length
        
    Returns:
        Sanitized text
    """
    if not isinstance(text, str):
        return ""
    
    # Truncate if too long
    text = text[:max_length]
    
    # Remove null bytes
    text = text.replace('\x00', '')
    
    # Remove potentially dangerous patterns
    dangerous_patterns = [
        r'os\.',
        r'sys\.',
        r'import\s+',
        r'exec\(',
        r'eval\(',
        r'__[a-z]+__',
    ]
    
    for pattern in dangerous_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    
    return text.strip()


def extract_numbers(text: str) -> list:
    """
    Extract all numbers from text.
    
    Args:
        text: Text to search
        
    Returns:
        List of floats found in text
    """
    pattern = r'-?\d+(?:\.\d+)?'
    matches = re.findall(pattern, text)
    return [float(m) for m in matches]
