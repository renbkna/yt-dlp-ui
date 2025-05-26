import os
from typing import List, Optional
from pathlib import Path
import tempfile

try:
    from pydantic_settings import BaseSettings
    from pydantic import validator, Field
except ImportError:
    # Fallback for older pydantic versions
    from pydantic import BaseSettings, validator, Field


class Settings(BaseSettings):
    """Application configuration with validation."""

    # API Configuration
    host: str = Field(default="localhost", description="API host")
    port: int = Field(default=8000, description="API port")
    debug: bool = Field(default=False, description="Debug mode")

    # Security Configuration
    allowed_origins: List[str] = Field(
        default=["http://localhost:5173"],  # Minimal default for development
        description="Allowed CORS origins - configure via YTDLP_ALLOWED_ORIGINS",
    )
    api_key: Optional[str] = Field(
        default=None, description="Optional API key for authentication"
    )
    max_requests_per_minute: int = Field(default=100, description="Rate limit per IP")

    # Download Configuration
    download_dir: Path = Field(
        default=Path("downloads"), description="Download directory"
    )
    max_concurrent_downloads: int = Field(
        default=5, description="Max concurrent downloads"
    )
    max_file_size_gb: float = Field(default=5.0, description="Max file size in GB")
    cleanup_after_days: int = Field(
        default=7, description="Cleanup downloads after days"
    )

    # Cookie Configuration
    cookie_dir: Path = Field(
        default=Path(tempfile.gettempdir()), description="Cookie storage directory"
    )
    cookie_expiry_hours: int = Field(default=1, description="Cookie expiry in hours")
    default_browser: str = Field(
        default="chrome", description="Default browser for cookies"
    )
    enable_browser_cookies: bool = Field(
        default=False,
        description="Enable automatic browser cookie extraction (can be unreliable on some systems)",
    )

    # yt-dlp Configuration
    ytdlp_timeout: int = Field(default=300, description="yt-dlp timeout in seconds")
    ytdlp_retries: int = Field(default=3, description="yt-dlp retry attempts")
    socket_timeout: int = Field(default=30, description="Socket timeout")

    # Database Configuration removed - using in-memory storage only

    # Logging Configuration
    log_level: str = Field(default="INFO", description="Logging level")
    log_file: Optional[str] = Field(
        default="yt_dlp_api.log", description="Log file path"
    )
    structured_logging: bool = Field(
        default=True, description="Use JSON structured logging"
    )

    @validator("allowed_origins")
    def validate_origins(cls, v):
        """Ensure no wildcard origins in production."""
        if "*" in v and len(v) > 1:
            raise ValueError("Cannot mix wildcard '*' with specific origins")
        return v

    @validator("download_dir", "cookie_dir")
    def create_directories(cls, v):
        """Ensure directories exist."""
        v.mkdir(parents=True, exist_ok=True)
        return v

    @validator("port")
    def validate_port(cls, v):
        """Validate port range."""
        if not (1 <= v <= 65535):
            raise ValueError("Port must be between 1 and 65535")
        return v

    @validator("max_file_size_gb")
    def validate_file_size(cls, v):
        """Validate file size limit."""
        if v <= 0:
            raise ValueError("Max file size must be positive")
        return v

    class Config:
        env_file = ".env"
        env_prefix = "YTDLP_"
        case_sensitive = False


# Global settings instance
settings = Settings()
