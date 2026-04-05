"""Backtesting Service for strategy code generation.

This module replaces the old TemplateEngine-based generator with a direct
dynamic engine execution using MT5 data and the BacktestEngine.
"""

import json
import logging
from typing import Dict, Any, Generator
from datetime import datetime
import pandas as pd
import ta
import MetaTrader5 as mt5

from backtesting.backtest import BacktestEngine, BacktestConfig
from backtesting.indicators import resolve_strategy
from utils.logger import get_logger

logger = get_logger(__name__)

# MT5 Timeframe mapping
TIMEFRAME_MAP = {
    "1m": mt5.TIMEFRAME_M1,
    "2m": mt5.TIMEFRAME_M2,
    "3m": mt5.TIMEFRAME_M3,
    "4m": mt5.TIMEFRAME_M4,
    "5m": mt5.TIMEFRAME_M5,
    "6m": mt5.TIMEFRAME_M6,
    "10m": mt5.TIMEFRAME_M10,
    "12m": mt5.TIMEFRAME_M12,
    "15m": mt5.TIMEFRAME_M15,
    "20m": mt5.TIMEFRAME_M20,
    "30m": mt5.TIMEFRAME_M30,
    "1h": mt5.TIMEFRAME_H1,
    "2h": mt5.TIMEFRAME_H2,
    "3h": mt5.TIMEFRAME_H3,
    "4h": mt5.TIMEFRAME_H4,
    "6h": mt5.TIMEFRAME_H6,
    "8h": mt5.TIMEFRAME_H8,
    "12h": mt5.TIMEFRAME_H12,
    "1d": mt5.TIMEFRAME_D1,
    "1w": mt5.TIMEFRAME_W1,
    "1mn": mt5.TIMEFRAME_MN1,
    "mo": mt5.TIMEFRAME_MN1,
    "1mo": mt5.TIMEFRAME_MN1,
}

class BacktestingService:
    """Service wrapper for executing dynamic backtests."""
    
    def __init__(self):
        logger.info("BacktestingService initialized")

    def _fetch_data(self, pair: str, timeframe_str: str, start: str, end: str) -> pd.DataFrame:
        """Fetch historical data from MT5 and compute all supported indicators."""
        if not mt5.initialize():
            logger.error("Failed to initialize MT5")
            raise RuntimeError("Failed to initialize MT5")

        try:
            timeframe = TIMEFRAME_MAP.get(timeframe_str.lower(), mt5.TIMEFRAME_H1)
            
            rates = None
            date_from = None
            date_to = None
            
            if start and end and start != "None" and end != "None":
                try:
                    def parse_dt(s: str) -> datetime:
                        s = s.strip()
                        for fmt in ("%Y-%m-%dT%H:%M", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
                            try:
                                return datetime.strptime(s, fmt)
                            except ValueError:
                                continue
                        raise ValueError(f"Unrecognised date format: {s}")

                    date_from = parse_dt(start)
                    date_to   = parse_dt(end)

                    logger.info(f"Fetching MT5 data (5000 candles) for {pair} ending at {date_to}")
                    # Fetch 5000 candles ending at date_to to ensure enough warmup for indicators
                    rates = mt5.copy_rates_from(pair, timeframe, date_to, 5000)

                    if rates is None or len(rates) == 0:
                        logger.warning(
                            f"MT5 returned no data for {pair} ending at {date_to}. "
                            "Falling back to recent data."
                        )
                        rates = None

                except Exception as e:
                    logger.warning(f"Date parsing failed ({start} - {end}): {e}. Using recent data.")
            
            if rates is None or len(rates) == 0:
                logger.info(f"Fetching latest 5000 candles for {pair}")
                rates = mt5.copy_rates_from_pos(pair, timeframe, 0, 5000)
            
            if rates is None or len(rates) == 0:
                raise ValueError(f"No MT5 data found for {pair}")
            
            df = pd.DataFrame(rates)
            df['datetime_obj'] = pd.to_datetime(df['time'], unit='s')
            df['timestamp'] = df['datetime_obj'].dt.strftime('%Y-%m-%d %H:%M')
            
            # --- Indicators Calculation ---
            # 1. RSI
            df['rsi'] = ta.momentum.RSIIndicator(df['close'], window=14).rsi()
            # 2. MACD
            macd = ta.trend.MACD(df['close'])
            df['macd'] = macd.macd_diff() # Using diff as cross-over signal
            # 3. SMA
            df['sma50'] = ta.trend.SMAIndicator(df['close'], window=50).sma_indicator()
            df['sma200'] = ta.trend.SMAIndicator(df['close'], window=200).sma_indicator()
            # 4. Bollinger Bands
            bb = ta.volatility.BollingerBands(df['close'], window=20, window_dev=2)
            df['bb_upper'] = bb.bollinger_hband()
            df['bb_lower'] = bb.bollinger_lband()
            # 5. Stochastic
            stoch = ta.momentum.StochasticOscillator(df['high'], df['low'], df['close'], window=14, smooth_window=3)
            df['stochastic'] = stoch.stoch()
            
            # Drop NaN rows initially to ensure aligned indicators
            df = df.dropna().reset_index(drop=True)
            
            # Filter to requested date window if needed
            if date_from and date_to:
                df = df[(df['datetime_obj'] >= date_from) & (df['datetime_obj'] <= date_to)]
                df = df.reset_index(drop=True)
                
            return df

        finally:
            mt5.shutdown()

    def run_backtest(self, strategy_id: str, rules: Dict[str, Any], timeout: int = 400) -> Dict[str, Any]:
        """Run a backtest synchronously."""
        try:
            logger.info(f"Running backtest {strategy_id} for {rules.get('pair')}")
            
            strategy_fn = resolve_strategy(rules.get('indicator', 'rsi'))
            
            config = BacktestConfig(
                pair=rules["pair"].upper(),
                timeframe=rules["timeframe"],
                initial_capital=float(rules["initial_capital"]),
                stop_loss=float(rules.get("stop_loss", 0.02) or 0.02),
                take_profit=float(rules.get("take_profit", 0.05) or 0.05),
                start_date=rules.get("start_date"),
                end_date=rules.get("end_date"),
                strategy_fn=strategy_fn
            )

            df = self._fetch_data(config.pair, config.timeframe, config.start_date, config.end_date)
            
            candles = df[['open', 'high', 'low', 'close', 'tick_volume', 'timestamp']].rename(columns={'tick_volume': 'volume'}).to_dict('records')
            indicators = df[['rsi', 'macd', 'sma50', 'sma200', 'bb_upper', 'bb_lower', 'stochastic']].to_dict('records')

            engine = BacktestEngine(config)
            result = engine.run(candles, indicators)

            # Format trades for frontend
            formatted_trades = []
            for t in result.trades:
                # Entry
                formatted_trades.append({
                    "action": t.action,
                    "price": t.entry_price,
                    "time": t.entry_time,
                    "profit": None
                })
                # Exit
                formatted_trades.append({
                    "action": "SELL" if t.action == "BUY" else "BUY",
                    "price": t.exit_price,
                    "time": t.exit_time,
                    "profit": t.pnl
                })

            return {
                "result": {
                    "profit_loss": result.total_pnl,
                    "win_rate": result.win_rate,
                    "max_drawdown": result.max_drawdown,
                    "sharpe_ratio": result.sharpe_ratio,
                    "trades_count": result.trades_count
                },
                "trades": formatted_trades,
                "errors": []
            }

        except Exception as e:
            logger.error(f"Backtest error: {str(e)}", exc_info=True)
            return {"error": True, "message": str(e), "trades": [], "result": {}}

    def stream_backtest(self, strategy_id: str, rules: Dict[str, Any]) -> Generator:
        """Stream backtest progress via SSE."""
        
        def sse_generator():
            try:
                logger.info(f"Streaming backtest {strategy_id}")
                
                strategy_fn = resolve_strategy(rules.get('indicator', 'rsi'))
                
                config = BacktestConfig(
                    pair=rules["pair"].upper(),
                    timeframe=rules["timeframe"],
                    initial_capital=float(rules["initial_capital"]),
                    stop_loss=float(rules.get("stop_loss", 0.02) or 0.02),
                    take_profit=float(rules.get("take_profit", 0.05) or 0.05),
                    start_date=rules.get("start_date"),
                    end_date=rules.get("end_date"),
                    strategy_fn=strategy_fn
                )

                df = self._fetch_data(config.pair, config.timeframe, config.start_date, config.end_date)
                
                engine = BacktestEngine(config)
                
                # We replicate engine.run loop here to yield progress
                capital = config.initial_capital
                trades_pnl = []
                in_position = False
                entry_price = 0.0
                entry_action = ""
                
                total = len(df)
                for i in range(total):
                    if i % 500 == 0:
                        yield f"data: {json.dumps({'type': 'progress', 'data': {'candle': i, 'total': total}})}\n\n"
                    
                    row = df.iloc[i]
                    data = row.to_dict()
                    current_price = data['close']
                    current_time = data['timestamp']
                    
                    if in_position:
                        exit_reason = None
                        pnl_pct = (current_price - entry_price) / entry_price if entry_action == "BUY" else (entry_price - current_price) / entry_price
                        
                        if pnl_pct <= -config.stop_loss: exit_reason = "STOP_LOSS"
                        elif pnl_pct >= config.take_profit: exit_reason = "TAKE_PROFIT"
                        else:
                            signal = strategy_fn(data)['action']
                            if signal == ("SELL" if entry_action == "BUY" else "BUY"): exit_reason = "SIGNAL"
                        
                        if exit_reason:
                            pnl = capital * pnl_pct
                            capital += pnl
                            trades_pnl.append(pnl)
                            in_position = False
                            yield f"data: {json.dumps({'type': 'trade', 'data': {'action': 'SELL' if entry_action == 'BUY' else 'BUY', 'price': current_price, 'time': current_time, 'profit': pnl}})}\n\n"
                            continue
                            
                    res = strategy_fn(data)
                    if not in_position and res['action'] in ['BUY', 'SELL']:
                        in_position = True
                        entry_price = current_price
                        entry_action = res['action']
                        yield f"data: {json.dumps({'type': 'trade', 'data': {'action': entry_action, 'price': entry_price, 'time': current_time, 'profit': None}})}\n\n"

                # Final result
                wins = [p for p in trades_pnl if p > 0]
                win_rate = (len(wins) / len(trades_pnl) * 100) if trades_pnl else 0.0
                
                final_res = {
                    "profit_loss": capital - config.initial_capital,
                    "win_rate": win_rate,
                    "max_drawdown": 0.0, # Simplified for stream
                    "sharpe_ratio": 0.0,
                    "trades_count": len(trades_pnl)
                }
                yield f"data: {json.dumps({'type': 'result', 'data': final_res})}\n\n"

            except Exception as e:
                logger.error(f"Stream error: {e}")
                yield f"data: {json.dumps({'type': 'error', 'data': {'message': str(e)}})}\n\n"

        return sse_generator()