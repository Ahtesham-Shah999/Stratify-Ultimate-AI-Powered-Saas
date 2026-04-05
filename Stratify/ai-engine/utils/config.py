"""Configuration management.

This module now loads environment variables from a local `.env` file
when present (via python-dotenv) so running `uvicorn` from the ai-engine
folder picks up values like `GENAI_API_KEY` defined in `.env`.
"""

import os
from typing import Optional
try:
    # load .env into environment for local development
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    # python-dotenv not available or .env missing — proceed with os.environ
    pass


class Config:
    """Application configuration from environment variables."""
    
    APP_NAME: str = "Stratify AI Engine"
    ENV: str = os.getenv("ENV", "development")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    # Backends: deterministic (regex), ollama_parse, ollama_validate
    NLP_BACKEND: str = os.getenv("NLP_BACKEND", "deterministic")
    PARSER_BACKEND: str = os.getenv("PARSER_BACKEND", "deterministic")
    VALIDATOR_BACKEND: str = os.getenv("VALIDATOR_BACKEND", "deterministic")
    # Google GenAI settings
    GENAI_API_KEY: str = os.getenv("GENAI_API_KEY", "")
    GENAI_PROJECT: str = os.getenv("GENAI_PROJECT", "")
    GENAI_MODEL: str = os.getenv("GENAI_MODEL", "gemini-2.0-flash")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # API configuration
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8001"))
    
    @classmethod
    def validate(cls) -> None:
        """Validate configuration."""
        # Minimal validation
        if cls.PARSER_BACKEND not in {"deterministic", "gemini"}:
            raise ValueError(f"Invalid PARSER_BACKEND: {cls.PARSER_BACKEND}")
        if cls.VALIDATOR_BACKEND not in {"deterministic", "gemini"}:
            raise ValueError(f"Invalid VALIDATOR_BACKEND: {cls.VALIDATOR_BACKEND}")
        if cls.LOG_LEVEL not in ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]:
            raise ValueError(f"Invalid LOG_LEVEL: {cls.LOG_LEVEL}")


def get_config() -> Config:
    """Get application configuration."""
    Config.validate()
    return Config()
