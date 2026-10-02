"""Application configuration using Pydantic settings."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # LiveKit
    livekit_url: str
    livekit_api_key: str
    livekit_api_secret: str

    # Database
    database_url: str = "sqlite+aiosqlite:///./aura_support.db"

    # CORS
    frontend_origin: str = "http://localhost:8081"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "INFO"

    # Groq (free tier) - used for both STT and LLM
    groq_api_key: str | None = None
    groq_base_url: str = "https://api.groq.com/openai/v1"
    groq_stt_model: str = "whisper-large-v3-turbo"
    # 70b = reliable tool calling. If you hit rate limits, try llama-3.1-8b-instant
    groq_llm_model: str = "llama-3.3-70b-versatile"
    stt_language: str = "en"

    # edge-tts (free, no key) - Indian English voice
    tts_voice: str = "en-IN-NeerjaNeural"
    tts_rate: str = "+8%"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )
    
    def get_cors_origins(self) -> list[str]:
        """Parse comma-separated FRONTEND_ORIGIN into a list."""
        origins = [origin.strip() for origin in self.frontend_origin.split(",")]
        # Also support localhost for development
        allowed_origins = origins + [
            "http://localhost:3000",
            "http://localhost:8081",
        ]
        return list(dict.fromkeys(allowed_origins))


settings = Settings()
