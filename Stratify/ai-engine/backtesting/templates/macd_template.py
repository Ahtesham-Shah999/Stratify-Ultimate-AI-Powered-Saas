"""MACD (Moving Average Convergence Divergence) Backtesting Template.

Uses pandas-ta macd() with crossover of macd line and signal line.
Buy when MACD crosses above signal line.
Sell when MACD crosses below signal line.
"""

import json
import sys
import pandas as pd
import ta
import MetaTrader5 as mt5
from datetime import datetime

# Template placeholders (will be replaced by TemplateEngine)
SYMBOL = "{{SYMBOL}}"
TIMEFRAME = "{{TIMEFRAME}}"
INITIAL_CAPITAL = {{INITIAL_CAPITAL}}
BUY_CONDITION = "{{BUY_CONDITION}}"
SELL_CONDITION = "{{SELL_CONDITION}}"
START_DATE = "{{START_DATE}}"
END_DATE = "{{END_DATE}}"

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
    """Execute MACD-based backtest."""
    
    # Initialize MetaTrader5
    if not mt5.initialize():
        print(json.dumps({"type": "error", "data": {"message": "Failed to initialize MT5"}}))
        return
    
    try:
        # Fetch historical data
        timeframe = TIMEFRAME_MAP.get(TIMEFRAME, mt5.TIMEFRAME_H1)
        
        rates = None
        if START_DATE != "None" and END_DATE != "None":
            try:
                # Handle YYYY-MM-DDTHH:MM or YYYY-MM-DD
                sd = START_DATE.replace('T', ' ')
                ed = END_DATE.replace('T', ' ')
                
                # Standardize formats for parsing
                if len(sd) == 10: sd += " 00:00:00"
                elif len(sd) == 16: sd += ":00"
                
                if len(ed) == 10: ed += " 23:59:59"
                elif len(ed) == 16: ed += ":59"
                
                date_from = datetime.strptime(sd, "%Y-%m-%d %H:%M:%S")
                date_to = datetime.strptime(ed, "%Y-%m-%d %H:%M:%S")
                
                rates = mt5.copy_rates_range(SYMBOL, timeframe, date_from, date_to)
            except Exception:
                pass # Fallback below
        
        if rates is None or len(rates) == 0:
            rates = mt5.copy_rates_from_pos(SYMBOL, timeframe, 0, 5000)
        
        if rates is None or len(rates) == 0:
            print(json.dumps({"type": "error", "data": {"message": f"No data for {SYMBOL}"}}))
            return
        
        # Convert to DataFrame
        df = pd.DataFrame(rates)
        df['time'] = pd.to_datetime(df['time'], unit='s')
        
        # Calculate MACD
        macd_indicator = ta.trend.MACD(df['close'])
        df['macd'] = macd_indicator.macd()
        df['macd_signal'] = macd_indicator.macd_signal()
        df['macd_hist'] = macd_indicator.macd_diff()
        
        # Backtesting logic
        position = None
        trades = []
        balance = INITIAL_CAPITAL
        
        for i in range(26, len(df)):
            price = df['close'].iloc[i]
            time_str = df['time'].iloc[i].strftime("%Y-%m-%d %H:%M")
            macd_val = df['macd'].iloc[i]
            signal_val = df['macd_signal'].iloc[i]
            
            # Check crossover
            if i > 26:
                prev_macd = df['macd'].iloc[i-1]
                prev_signal = df['macd_signal'].iloc[i-1]
                
                # Buy signal: MACD crosses above signal
                if position is None and prev_macd <= prev_signal and macd_val > signal_val:
                    position = {"entry_price": price, "entry_time": time_str, "entry_index": i}
                    print(json.dumps({
                        "type": "trade",
                        "data": {"action": "BUY", "price": float(price), "time": time_str, "profit": None}
                    }))
                
                # Sell signal: MACD crosses below signal
                elif position is not None and prev_macd >= prev_signal and macd_val < signal_val:
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
