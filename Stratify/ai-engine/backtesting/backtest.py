"""
Core Backtesting Engine for Stratify.
Handles trade lifecycle, capital tracking, and statistic calculation.
"""

from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class BacktestConfig:
    pair: str
    timeframe: str
    initial_capital: float
    stop_loss: float  # as a decimal, e.g., 0.02 for 2%
    take_profit: float # as a decimal, e.g., 0.05 for 5%
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    strategy_fn: Optional[Callable] = None

@dataclass
class TradeRecord:
    entry_price: float
    exit_price: float
    action: str  # "BUY" or "SELL"
    entry_time: str
    exit_time: str
    pnl: float
    pnl_pct: float
    exit_reason: str  # "SIGNAL", "STOP_LOSS", "TAKE_PROFIT"

@dataclass
class BacktestResult:
    total_pnl: float
    total_pnl_pct: float
    win_rate: float
    max_drawdown: float
    sharpe_ratio: float
    trades_count: int
    trades: List[TradeRecord] = field(default_factory=list)

class BacktestEngine:
    def __init__(self, config: BacktestConfig):
        self.config = config

    def run(self, candles: List[Dict[str, Any]], indicator_values: List[Dict[str, Any]]) -> BacktestResult:
        capital = self.config.initial_capital
        trades: List[TradeRecord] = []
        
        in_position = False
        entry_price = 0.0
        entry_time = ""
        entry_action = ""
        
        # We assume candles and indicator_values are aligned by index
        for i, candle in enumerate(candles):
            if i >= len(indicator_values):
                break
                
            data = {**candle, **indicator_values[i]}
            current_price = candle['close']
            current_time = candle['timestamp']
            
            # 1. Check Exit Conditions if in position
            if in_position:
                exit_reason = None
                pnl_pct = 0.0
                
                if entry_action == "BUY":
                    pnl_pct = (current_price - entry_price) / entry_price
                else:
                    pnl_pct = (entry_price - current_price) / entry_price
                
                # Check Hard SL/TP
                if pnl_pct <= -self.config.stop_loss:
                    exit_reason = "STOP_LOSS"
                elif pnl_pct >= self.config.take_profit:
                    exit_reason = "TAKE_PROFIT"
                else:
                    # Check Signal Reversal
                    signal = self.config.strategy_fn(data)['action'] if self.config.strategy_fn else "HOLD"
                    opposite = "SELL" if entry_action == "BUY" else "BUY"
                    if signal == opposite:
                        exit_reason = "SIGNAL"
                
                if exit_reason:
                    pnl = capital * pnl_pct
                    trades.append(TradeRecord(
                        entry_price=entry_price,
                        exit_price=current_price,
                        action=entry_action,
                        entry_time=entry_time,
                        exit_time=current_time,
                        pnl=pnl,
                        pnl_pct=pnl_pct * 100,
                        exit_reason=exit_reason
                    ))
                    capital += pnl
                    in_position = False
                    continue # Moved to next candle after exit
                    
            # 2. Check Entry Conditions
            if not in_position and self.config.strategy_fn:
                signal_res = self.config.strategy_fn(data)
                signal = signal_res.get('action', 'HOLD')
                
                if signal in ["BUY", "SELL"]:
                    in_position = True
                    entry_price = current_price
                    entry_time = current_time
                    entry_action = signal
                    
        return self._calculate_stats(trades, capital)

    def _calculate_stats(self, trades: List[TradeRecord], final_capital: float) -> BacktestResult:
        total_pnl = final_capital - self.config.initial_capital
        total_pnl_pct = (total_pnl / self.config.initial_capital) * 100
        
        wins = [t for t in trades if t.pnl > 0]
        win_rate = (len(wins) / len(trades) * 100) if trades else 0.0
        
        # Max Drawdown calculation
        peak = self.config.initial_capital
        current_cap = self.config.initial_capital
        max_dd = 0.0
        
        for t in trades:
            current_cap += t.pnl
            if current_cap > peak:
                peak = current_cap
            
            dd = (peak - current_cap) / peak * 100
            if dd > max_dd:
                max_dd = dd
        # Sharpe ratio Calculation
        if len(trades) > 1:
            import statistics
            returns = [t.pnl_pct for t in trades]
            mean_return = statistics.mean(returns)
            stdev = statistics.stdev(returns)
            sharpe_ratio = (mean_return / stdev) if stdev > 0 else 0.0
        else:
            sharpe_ratio = 0.0
                
        return BacktestResult(
            total_pnl=total_pnl,
            total_pnl_pct=total_pnl_pct,
            win_rate=win_rate,
            max_drawdown=max_dd,
            sharpe_ratio=sharpe_ratio,
            trades_count=len(trades),
            trades=trades
        )
