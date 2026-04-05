"""RSI (Relative Strength Index) Backtesting Template.

Uses pandas-ta RSI indicator with default period=14.
Buy when RSI < 30, Sell when RSI > 70 (customizable via placeholders).
"""

import json
import sys
import pandas as pd
import ta
import MetaTrader5 as mt5
from datetime import datetime

# Template placeholders (will be replaced by TemplateEngine)
SYMBOL = "XAUUSD"
TIMEFRAME = "1h"
INITIAL_CAPITAL = 10000
BUY_CONDITION = "rsi < 30"
SELL_CONDITION = "rsi > 70"

# Timeframe mapping
TIMEFRAME_MAP = {
    "1m": mt5.TIMEFRAME_M1,
    "5m": mt5.TIMEFRAME_M5,
    "15m": mt5.TIMEFRAME_M15,
    "30m": mt5.TIMEFRAME_M30,
    "1h": mt5.TIMEFRAME_H1,
    "4h": mt5.TIMEFRAME_H4,
    "1d": mt5.TIMEFRAME_D1,
    "1w": mt5.TIMEFRAME_W1,
}


def backtest():
    """Execute RSI-based backtest."""
    
    # Initialize MetaTrader5
    if not mt5.initialize():
        print(json.dumps({"type": "error", "data": {"message": "Failed to initialize MT5"}}))
        return
    
    try:
        # Fetch historical data
        timeframe = TIMEFRAME_MAP.get(TIMEFRAME, mt5.TIMEFRAME_H1)
        rates = mt5.copy_rates_from_pos(SYMBOL, timeframe, 0, 5000)
        
        if rates is None or len(rates) == 0:
            print(json.dumps({"type": "error", "data": {"message": f"No data for {SYMBOL}"}}))
            return
        
        # Convert to DataFrame
        df = pd.DataFrame(rates)
        df['time'] = pd.to_datetime(df['time'], unit='s')
        
        # Calculate RSI
        df['rsi'] = ta.momentum.RSIIndicator(df['close'], window=14).rsi()
        
        # Backtesting logic
        position = None
        trades = []
        balance = INITIAL_CAPITAL
        
        for i in range(14, len(df)):
            rsi = df['rsi'].iloc[i]
            price = df['close'].iloc[i]
            time_str = df['time'].iloc[i].strftime("%Y-%m-%d %H:%M")
            
            # Buy signal
            if position is None and rsi < 30:  # eval(BUY_CONDITION)
                position = {"entry_price": price, "entry_time": time_str, "entry_index": i}
                print(json.dumps({
                    "type": "trade",
                    "data": {"action": "BUY", "price": float(price), "time": time_str, "profit": None}
                }))
            
            # Sell signal
            elif position is not None and rsi > 70:  # eval(SELL_CONDITION)
                profit = (price - position["entry_price"]) / position["entry_price"] * balance
                trades.append(profit)
                balance += profit
                print(json.dumps({
                    "type": "trade",
                    "data": {"action": "SELL", "price": float(price), "time": time_str, "profit": float(profit)}
                }))
                position = None
            
            # Progress log
            if i % 500 == 0:
                print(json.dumps({
                    "type": "progress",
                    "data": {"candle": i, "total": len(df)}
                }))
        
        # Calculate statistics
        if trades:
            win_count = len([t for t in trades if t > 0])
            win_rate = win_count / len(trades)
            profit_loss = sum(trades)
            max_drawdown = min(trades) / INITIAL_CAPITAL if trades else 0
            sharpe_ratio = (profit_loss / len(trades)) / (sum(t**2 for t in trades) / len(trades) + 1e-6) if trades else 0
        else:
            win_rate = 0.0
            profit_loss = 0.0
            max_drawdown = 0.0
            sharpe_ratio = 0.0
            trades = []
        
        # Final result
        print(json.dumps({
            "type": "result",
            "data": {
                "profit_loss": float(profit_loss),
                "win_rate": float(win_rate),
                "max_drawdown": float(abs(max_drawdown)),
                "sharpe_ratio": float(sharpe_ratio),
                "trades_count": len(trades)
            }
        }))
    
    finally:
        mt5.shutdown()


if __name__ == "__main__":
    backtest()
