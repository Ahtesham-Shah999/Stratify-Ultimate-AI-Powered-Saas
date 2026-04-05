"""Backtest streamer for Server-Sent Events (SSE) output.

Provides `BacktestStreamer` to stream backtest execution output in real-time
as JSON events using the SSE format.
"""
from __future__ import annotations

import os
import sys
import json
import subprocess
from typing import Generator, TYPE_CHECKING

from utils.logger import get_logger

if TYPE_CHECKING:
    from backtesting.runner import BacktestRunner

logger = get_logger(__name__)


class BacktestStreamer:
    """Stream backtest execution output in real-time using SSE format.

    Wraps a BacktestRunner to execute scripts and yield their stdout output
    as Server-Sent Events (SSE) JSON objects. Each line of valid JSON is
    streamed, along with error and completion markers.
    """

    def __init__(self, runner: BacktestRunner):
        """Initialize streamer with a BacktestRunner instance.

        Args:
            runner: BacktestRunner used to locate and manage script files.
        """
        self.runner = runner
        logger.info("BacktestStreamer initialized")

    def stream(self, strategy_id: str, timeout: int = 400) -> Generator:
        """Stream script output as SSE events.

        Looks for {strategy_id}.py in runner.backtest_dir, executes it,
        and yields stdout lines as SSE JSON events. Also handles errors and
        timeouts.

        Args:
            strategy_id: The identifier used to locate the script file.
            timeout: Seconds to allow the script to run before timing out.

        Yields:
            SSE-formatted strings (data: JSON\n\n format) for each stdout line,
            plus error and completion events.
        """
        script_path = os.path.join(self.runner.backtest_dir, f"{strategy_id}.py")
        if not os.path.exists(script_path):
            logger.error("Script not found for streaming: %s", script_path)
            yield f"data: {json.dumps({'type': 'error', 'data': {'message': 'Script not found'}})}\n\n"
            return

        proc = subprocess.Popen(
            [sys.executable, script_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        # Stream stdout line by line
        try:
            for line in iter(proc.stdout.readline, ""):
                line = line.strip()
                if not line:
                    continue

                try:
                    obj = json.loads(line)
                    yield f"data: {line}\n\n"
                except json.JSONDecodeError:
                    logger.warning("Skipping non-JSON stdout line: %s", line)
                    continue

            # Check for stderr
            stderr = proc.stderr.read()
            if stderr:
                logger.error("Backtest stderr: %s", stderr)
                yield f"data: {json.dumps({'type': 'error', 'data': {'message': stderr}})}\n\n"

            # Wait for process to finish
            try:
                proc.wait(timeout=timeout)
            except subprocess.TimeoutExpired:
                proc.kill()
                logger.error("Backtest stream timed out after %d seconds", timeout)
                yield f"data: {json.dumps({'type': 'error', 'data': {'message': 'Backtest timed out'}})}\n\n"

        except Exception as exc:
            logger.exception("Error during stream: %s", exc)
            yield f"data: {json.dumps({'type': 'error', 'data': {'message': str(exc)}})}\n\n"
        finally:
            # Always send completion signal
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

    def prepare_and_stream(
        self, strategy_id: str, code: str, timeout: int = 400
    ) -> Generator:
        """Save script and stream its execution output.

        Convenience method that saves the code first, then streams execution.

        Args:
            strategy_id: The identifier for the strategy and script filename.
            code: The Python code to save.
            timeout: Seconds to allow the script to run before timing out.

        Yields:
            SSE-formatted event strings (see stream method).
        """
        try:
            self.runner.save_script(strategy_id, code)
        except Exception as exc:
            logger.exception("Failed to save script for streaming: %s", exc)
            yield f"data: {json.dumps({'type': 'error', 'data': {'message': str(exc)}})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return

        # Stream the saved script
        yield from self.stream(strategy_id, timeout=timeout)
