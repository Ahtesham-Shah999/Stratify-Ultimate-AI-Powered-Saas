"""Backtesting package.

This package provides backtesting infrastructure and services for validating
trading strategies using historical market data.

Main exports:
- BacktestingService: High-level service for code generation
- TemplateEngine: Low-level template management and code generation
- BacktestRunner: Executes generated scripts and collects results
- BacktestStreamer: Streams backtest execution output in real-time
"""

from backtesting.template_engine import TemplateEngine
from backtesting.service import BacktestingService
from backtesting.market_interface import MT5Connector, DataFetcher
from backtesting.runner import BacktestRunner
from backtesting.streamer import BacktestStreamer

__all__ = ["TemplateEngine", "BacktestingService", "MT5Connector", "DataFetcher", "BacktestRunner", "BacktestStreamer"]
