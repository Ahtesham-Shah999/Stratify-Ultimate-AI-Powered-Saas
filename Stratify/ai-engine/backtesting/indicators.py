"""
Indicator Logic and Combinations for Stratify.
"""

from typing import Dict, Any, Callable

def rsi_logic(data: Dict[str, Any]) -> Dict[str, Any]:
    rsi = data.get('rsi')
    if rsi is None: return {'action': 'HOLD'}
    if rsi < 30: return {'action': 'BUY'}
    if rsi > 70: return {'action': 'SELL'}
    return {'action': 'HOLD'}

def macd_logic(data: Dict[str, Any]) -> Dict[str, Any]:
    macd = data.get('macd')
    if macd is None: return {'action': 'HOLD'}
    if macd > 0: return {'action': 'BUY'}
    if macd < 0: return {'action': 'SELL'}
    return {'action': 'HOLD'}

def sma_logic(data: Dict[str, Any]) -> Dict[str, Any]:
    sma50 = data.get('sma50')
    sma200 = data.get('sma200')
    if sma50 is None or sma200 is None: return {'action': 'HOLD'}
    s50, s200 = float(sma50), float(sma200)
    if s50 > s200: return {'action': 'BUY'}
    if s50 < s200: return {'action': 'SELL'}
    return {'action': 'HOLD'}

def bollinger_logic(data: Dict[str, Any]) -> Dict[str, Any]:
    close = data.get('close')
    upper = data.get('bb_upper')
    lower = data.get('bb_lower')
    if None in [close, upper, lower]: return {'action': 'HOLD'}
    c, u, l = float(close), float(upper), float(lower)
    if c <= l: return {'action': 'BUY'}
    if c >= u: return {'action': 'SELL'}
    return {'action': 'HOLD'}

def stochastic_logic(data: Dict[str, Any]) -> Dict[str, Any]:
    stoch = data.get('stochastic')
    if stoch is None: return {'action': 'HOLD'}
    if stoch < 20: return {'action': 'BUY'}
    if stoch > 80: return {'action': 'SELL'}
    return {'action': 'HOLD'}

# Combinations Registry
STRATEGIES: Dict[str, Callable] = {
    "rsi": rsi_logic,
    "macd": macd_logic,
    "sma": sma_logic,
    "bollingerband": bollinger_logic,
    "stochastic": stochastic_logic,
}

def resolve_strategy(name: str) -> Callable:
    # Cleanup and normalize
    raw_name = str(name).lower()
    for char in [",", "&", " and ", " + ", "  "]:
        raw_name = raw_name.replace(char, "_")
    
    # Strip parentheses like RSI(14)
    import re
    raw_name = re.sub(r'\(.*?\)', '', raw_name)
    
    key = raw_name.replace(" ", "_").replace("-", "_").strip("_")
    
    # Direct match
    if key in STRATEGIES:
        return STRATEGIES[key]
    
    # Handle composite keys like rsi_macd or rsi_macd_sma
    indicators = [i.strip() for i in key.split("_") if i.strip()]
    valid_indicators = [i for i in indicators if i in STRATEGIES]
    
    if valid_indicators:
        def composite_strategy(data: Dict[str, Any]) -> Dict[str, Any]:
            results = []
            for ind in valid_indicators:
                res = STRATEGIES[ind](data)
                results.append(res['action'])
            
            # Complex combination logic: 
            # If any indicator gives a signal, and NO indicator gives an opposite signal, 
            # we might take it? Actually, standard "combination" usually means ALL must agree.
            # But the user might mean "RSI < 30 AND MACD > 0".
            
            # Strict mode: All must agree on action
            if all(r == 'BUY' for r in results): return {'action': 'BUY'}
            if all(r == 'SELL' for r in results): return {'action': 'SELL'}
            return {'action': 'HOLD'}
            
        return composite_strategy
        
    return rsi_logic # Fallback

def get_supported_indicators():
    return list(STRATEGIES.keys())
