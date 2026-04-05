"""Market interface for backtesting.

This module contains a simple stub `MarketInterface` used by tests as well as
an MT5 connector and data fetcher used to retrieve historical OHLCV data from
MetaTrader5.
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
import json

from utils.logger import get_logger
import MetaTrader5 as mt5
import pandas as pd

logger = get_logger(__name__)


class MarketInterface:
    """
    Interface to fetch market metadata and historical data.

    Stub implementation returns deterministic fake data for testing.
    In production, this would connect to a real data provider (polygon.io, IQFeed, etc.)
    """

    def __init__(self, provider: str = "stub"):
        """
        Initialize market interface.

        Args:
            provider: Data provider name (default: "stub" for testing)
        """
        self.provider = provider

    def get_candles(
        self,
        symbol: str,
        timeframe: str,
        start: datetime,
        end: datetime,
    ) -> List[Dict[str, Any]]:
        """
        Fetch OHLCV candles for a symbol.

        Args:
            symbol: Trading symbol (e.g., "BTC", "AAPL")
            timeframe: Timeframe (e.g., "1h", "1d", "5m")
            start: Start datetime
            end: End datetime

        Returns:
            List of candle dicts with keys: timestamp, open, high, low, close, volume
        """
        if self.provider == "stub":
            return self._generate_stub_candles(symbol, timeframe, start, end)
        else:
            raise NotImplementedError(f"Provider '{self.provider}' not implemented")

    def get_indicators(
        self,
        symbol: str,
        timeframe: str,
        indicators: List[str],
        start: datetime,
        end: datetime,
    ) -> Dict[str, List[float]]:
        """
        Fetch pre-calculated indicators.

        Args:
            symbol: Trading symbol
            timeframe: Timeframe
            indicators: List of indicator names (e.g., ["RSI", "SMA", "EMA"]) 
            start: Start datetime
            end: End datetime

        Returns:
            Dict mapping indicator names to lists of values
        """
        if self.provider == "stub":
            return self._generate_stub_indicators(indicators, start, end)
        else:
            raise NotImplementedError(f"Provider '{self.provider}' not implemented")

    @staticmethod
    def _generate_stub_candles(
        symbol: str,
        timeframe: str,
        start: datetime,
        end: datetime,
    ) -> List[Dict[str, Any]]:
        """Generate deterministic fake candles for testing."""
        candles = []
        current = start

        # Generate 5 sample candles
        base_price = 50000 if symbol == "BTC" else 100

        for i in range(5):
            candle = {
                "timestamp": current,
                "open": base_price + (i * 100),
                "high": base_price + (i * 100) + 200,
                "low": base_price + (i * 100) - 100,
                "close": base_price + (i * 100) + 150,
                "volume": 1000000 + (i * 100000),
            }
            candles.append(candle)

        return candles

    @staticmethod
    def _generate_stub_indicators(
        indicators: List[str],
        start: datetime,
        end: datetime,
    ) -> Dict[str, List[float]]:
        """Generate deterministic fake indicator values for testing."""
        result = {}

        for indicator in indicators:
            if indicator == "RSI":
                result["RSI"] = [45.5, 50.2, 48.9, 52.1, 49.8]
            elif indicator == "SMA":
                result["SMA"] = [50100, 50200, 50300, 50400, 50500]
            elif indicator == "EMA":
                result["EMA"] = [50150, 50250, 50350, 50450, 50550]
            elif indicator == "MACD":
                result["MACD"] = [100, 150, 120, 180, 140]
            elif indicator == "Volume":
                result["Volume"] = [1000000, 1100000, 1200000, 1300000, 1400000]
            else:
                result[indicator] = [i * 10 for i in range(5)]

        return result


class MT5Connector:
    """Simple MetaTrader5 connector wrapper.

    Provides connect/disconnect and basic symbol info access.
    """

    def __init__(self):
        self._connected = False

    def connect(self) -> bool:
        """Initialize connection to the local MetaTrader5 terminal.

        Returns True if initialization succeeded, False otherwise.
        """
        try:
            ok = mt5.initialize()
        except Exception as exc:  # pragma: no cover - defensive
            logger.exception("MT5 initialize raised an exception: %s", exc)
            self._connected = False
            return False

        if ok:
            self._connected = True
            logger.info("Connected to MetaTrader5 terminal")
            return True
        else:
            self._connected = False
            logger.warning("Failed to initialize MetaTrader5 terminal")
            return False

    def disconnect(self) -> None:
        """Shutdown the MetaTrader5 connection and mark as disconnected."""
        try:
            mt5.shutdown()
        except Exception:  # pragma: no cover - defensive
            logger.exception("Error while shutting down MetaTrader5")
        finally:
            self._connected = False
            logger.info("Disconnected from MetaTrader5 terminal")

    def is_connected(self) -> bool:
        """Return True if connector believes MT5 is initialized."""
        return bool(self._connected)

    def get_symbol_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Return symbol information as a dict or None if not found.

        Args:
            symbol: Symbol name (e.g., 'EURUSD')

        Returns:
            dict with symbol info or None
        """
        try:
            info = mt5.symbol_info(symbol)
        except Exception as exc:  # pragma: no cover - defensive
            logger.exception("Error fetching symbol info for %s: %s", symbol, exc)
            return None

        if info is None:
            logger.warning("Symbol not found: %s", symbol)
            return None

        # MetaTrader5 SymbolInfo is convertible to dict via _asdict()
        try:
            return info._asdict()
        except Exception:
            # Fallback: try JSON round-trip
            try:
                return json.loads(json.dumps(info, default=lambda o: getattr(o, "__dict__", str(o))))
            except Exception:  # pragma: no cover - defensive
                logger.exception("Failed to convert symbol info to dict for %s", symbol)
                return None


class DataFetcher:
    """Fetch historical OHLCV data from MetaTrader5.

    Usage:
        connector = MT5Connector()
        fetcher = DataFetcher(connector)
        df = fetcher.fetch_candles('EURUSD', '1h', count=1000)
    """

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

    def __init__(self, connector: MT5Connector):
        """Create a DataFetcher using an `MT5Connector` instance.

        Args:
            connector: An MT5Connector used to manage the MT5 terminal connection.
        """
        self.connector = connector

    def fetch_candles(self, symbol: str, timeframe: str, count: int = 5000) -> pd.DataFrame:
        """Fetch recent candles for `symbol`.

        Connects to MT5 via the connector, copies `count` bars starting from
        the most recent bar and returns a pandas DataFrame. Adds a human
        readable `time` column.

        Raises:
            ConnectionError: if MT5 fails to connect
            ValueError: if no data is returned for the symbol
        """
        if not self.connector.connect():
            raise ConnectionError("Failed to connect to MetaTrader5 terminal")

        tf = self.TIMEFRAME_MAP.get(timeframe)
        if tf is None:
            logger.warning("Unknown timeframe '%s', defaulting to 1h", timeframe)
            tf = mt5.TIMEFRAME_H1

        try:
            rates = mt5.copy_rates_from_pos(symbol, tf, 0, count)
        except Exception as exc:  # pragma: no cover - defensive
            logger.exception("Error fetching rates for %s: %s", symbol, exc)
            rates = None

        if rates is None or len(rates) == 0:
            # Keep connector connected state accurate by disconnecting
            logger.error("No data returned for symbol: %s", symbol)
            raise ValueError(f"No data returned for symbol: {symbol}")

        df = pd.DataFrame(rates)
        if "time" in df.columns:
            df["time"] = pd.to_datetime(df["time"], unit="s")

        logger.info("Fetched %d candles for %s (%s)", len(df), symbol, timeframe)
        return df

