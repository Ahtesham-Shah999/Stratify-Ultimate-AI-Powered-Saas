"""Backtest runner utility.

Provides `BacktestRunner` to save and execute generated strategy scripts and
collect JSON-line outputs produced by those scripts.
"""
from __future__ import annotations

import os
import sys
import json
import subprocess
import tempfile
from typing import Optional, List, Dict, Any

from utils.logger import get_logger

logger = get_logger(__name__)


class BacktestRunner:
    """Save and run generated backtest Python scripts.

    Scripts are saved under `backtest_dir` and executed with the same
    Python interpreter (`sys.executable`). Each script is expected to print
    newline-separated JSON objects to stdout describing progress, trades and
    a final result object.
    """

    def __init__(self, backtest_dir: Optional[str] = None):
        """Initialize runner and ensure output directory exists.

        Args:
            backtest_dir: Folder where generated strategy scripts will be saved.
                If None, defaults to `stratify_backtests` in the system temp directory.
        """
        if backtest_dir is None:
            backtest_dir = os.path.join(tempfile.gettempdir(), "stratify_backtests")

        os.makedirs(backtest_dir, exist_ok=True)
        self.backtest_dir = backtest_dir
        logger.info("BacktestRunner initialized, scripts directory: %s", backtest_dir)

    def save_script(self, strategy_id: str, code: str) -> str:
        """Save `code` to a Python file named `{strategy_id}.py`.

        Returns the absolute path to the saved file.
        """
        filename = f"{strategy_id}.py"
        path = os.path.join(self.backtest_dir, filename)
        try:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(code)
            logger.info("Saved strategy script: %s", path)
            return path
        except Exception as exc:
            logger.exception("Failed to save script %s: %s", path, exc)
            raise

    def run(self, strategy_id: str, timeout: int = 400) -> Dict[str, Any]:
        """Run the `{strategy_id}.py` script and collect JSON-line outputs.

        Args:
            strategy_id: The identifier used to locate the script file.
            timeout: Seconds to wait before killing the process.

        Returns:
            Dict containing strategy_id, trades list, result dict (or None), and errors list.

        Raises:
            FileNotFoundError: If the script file does not exist.
            TimeoutError: If the script exceeds the provided timeout.
        """
        script_path = os.path.join(self.backtest_dir, f"{strategy_id}.py")
        if not os.path.exists(script_path):
            logger.error("Script not found: %s", script_path)
            raise FileNotFoundError(script_path)

        env = os.environ.copy()
        env["PYTHONIOENCODING"] = "utf-8"
        env["PYTHONUNBUFFERED"] = "1"

        stdout_file = tempfile.TemporaryFile(mode='w+', encoding='utf-8')
        stderr_file = tempfile.TemporaryFile(mode='w+', encoding='utf-8')

        proc = subprocess.Popen(
            [sys.executable, script_path],
            stdout=stdout_file,
            stderr=stderr_file,
            text=True,
            env=env
        )

        try:
            proc.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            proc.kill()
            try:
                proc.wait(timeout=5)
            except Exception:
                pass
            stdout_file.close()
            stderr_file.close()
            msg = f"Backtest timed out after {timeout} seconds"
            logger.error(msg)
            raise TimeoutError(msg)

        trades: List[Dict[str, Any]] = []
        result: Optional[Dict[str, Any]] = None
        errors: List[str] = []

        # Read stdout
        stdout_file.seek(0)
        for line in stdout_file:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                logger.warning("Unable to decode stdout line as JSON: %s", line)
                continue

            typ = obj.get("type")
            if typ == "trade":
                trades.append(obj.get("data", obj))
            elif typ == "result":
                result = obj.get("data")

        # Read stderr
        stderr_file.seek(0)
        for line in stderr_file:
            line = line.strip()
            if line:
                errors.append(line)
                logger.error("Backtest stderr: %s", line)

        stdout_file.close()
        stderr_file.close()

        if result is None:
            logger.warning("No result object found in backtest output for %s", strategy_id)

        return {
            "strategy_id": strategy_id,
            "trades": trades,
            "result": result,
            "errors": errors,
        }

    def save_and_run(self, strategy_id: str, code: str, timeout: int = 400) -> Dict[str, Any]:
        """Save the script and immediately run it, returning the run result."""
        path = self.save_script(strategy_id, code)
        logger.info("Running saved script: %s", path)
        return self.run(strategy_id, timeout=timeout)
