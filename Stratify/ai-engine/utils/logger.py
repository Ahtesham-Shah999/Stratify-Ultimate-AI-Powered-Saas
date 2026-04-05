"""Structured logger factory."""

import logging
import sys
from typing import Optional

from .config import get_config


def get_logger(name: str) -> logging.Logger:
    """
    Get a configured logger instance.
    
    Args:
        name: Logger name (typically __name__)
        
    Returns:
        Configured Logger instance
    """
    config = get_config()
    logger = logging.getLogger(name)
    
    # Only configure if not already done
    if not logger.handlers:
        log_level = getattr(logging, config.LOG_LEVEL, logging.INFO)
        logger.setLevel(log_level)
        
        # Console handler
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(log_level)
        
        # Formatter
        formatter = logging.Formatter(
            fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        handler.setFormatter(formatter)
        
        logger.addHandler(handler)
    
    return logger
