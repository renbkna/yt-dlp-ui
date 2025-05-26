from fastapi import (
    FastAPI,
    HTTPException,
    Query,
    Request,
    Depends,
    File,
    UploadFile,
)
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl, Field, field_validator
from typing import Optional, List, Dict, Union, Any
import yt_dlp
import asyncio
import uuid
import os
import logging
import time
import re
import json
import tempfile
import subprocess
import shutil
import io
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urlparse, parse_qs, urlunparse, urlencode

# Import our new secure components
from config import settings
from security import RateLimitMiddleware, SecurityValidator, APIKeyAuth

# Database import removed - no longer using database

# Configure enhanced logging
if settings.structured_logging:
    import structlog

    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    logger = structlog.get_logger("yt-dlp-api")
else:
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper()),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            (
                logging.FileHandler(settings.log_file)
                if settings.log_file
                else logging.NullHandler()
            ),
            logging.StreamHandler(),
        ],
    )
    logger = logging.getLogger("yt-dlp-api")

# Use configuration values
DEFAULT_BROWSER = settings.default_browser
COOKIE_DIR = settings.cookie_dir
COOKIE_EXPIRY_HOURS = settings.cookie_expiry_hours


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("YT-DLP API starting up...")
    logger.info(f"Download directory: {settings.download_dir}")
    logger.info(f"Max concurrent downloads: {settings.max_concurrent_downloads}")
    logger.info(f"Rate limit: {settings.max_requests_per_minute} requests/minute")

    # Server-side task management removed - using direct downloads only
    logger.info("Using direct download mode only")

    yield

    # Shutdown
    logger.info("YT-DLP API shutting down...")
    logger.info("YT-DLP API shutdown complete")


app = FastAPI(
    title="YT-DLP API",
    description="Secure API for downloading videos using yt-dlp",
    version="1.0.1",
    debug=settings.debug,
    lifespan=lifespan,
)

# Add security middleware
app.add_middleware(
    RateLimitMiddleware,
    calls_per_minute=settings.max_requests_per_minute,
)

# Secure CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE"],  # Specific methods only
    allow_headers=["Content-Type", "Authorization"],  # Specific headers only
    allow_credentials=True,
)

# Optional API key authentication
api_key_auth = APIKeyAuth(settings.api_key)


class Cookie(BaseModel):
    """Model for a browser cookie."""

    domain: str
    name: str
    value: str
    path: str = "/"
    secure: bool = True
    httpOnly: bool = False
    expirationDate: Optional[float] = None

    @field_validator("domain")
    @classmethod
    def validate_domain(cls, v):
        # Basic domain validation - this could be enhanced
        if not re.match(r"^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", v):
            raise ValueError("Invalid domain format")
        return v

    @field_validator("name", "value")
    @classmethod
    def no_semicolons(cls, v):
        if ";" in v:
            raise ValueError("Semicolons not allowed in cookie name/value")
        return v


class CookieUpload(BaseModel):
    """Model for uploading cookies from client."""

    cookies: List[Cookie]
    source: str = "client"  # Indicates the source of cookies (client, extension, etc.)


class DownloadRequest(BaseModel):
    url: HttpUrl
    format: Optional[str] = Field(default="best", description="Video format code")
    extract_audio: bool = Field(default=False, description="Extract audio from video")
    audio_format: Optional[str] = Field(
        default=None, description="Audio format (mp3, m4a, etc.)"
    )
    quality: Optional[str] = Field(default=None, description="Audio quality (0-9)")
    embed_metadata: bool = Field(default=True, description="Embed metadata in file")
    embed_thumbnail: bool = Field(default=False, description="Embed thumbnail in file")
    download_subtitles: bool = Field(default=False, description="Download subtitles")
    subtitle_languages: Optional[List[str]] = Field(
        default=None, description="Subtitle languages"
    )
    download_playlist: bool = Field(
        default=False, description="Download all videos in playlist"
    )
    sponsorblock: bool = Field(default=False, description="Skip sponsored segments")
    use_browser_cookies: bool = Field(default=False, description="Use browser cookies")
    client_cookies: Optional[List[Cookie]] = Field(
        default=None, description="Cookies provided by the client"
    )
    chapters_from_comments: bool = Field(
        default=False, description="Create chapters from comments"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "format": "22",
                "extract_audio": False,
                "use_browser_cookies": True,
                "client_cookies": [
                    {
                        "domain": "youtube.com",
                        "name": "LOGIN_INFO",
                        "value": "AFmmF2swRQIhA...",
                        "path": "/",
                        "secure": True,
                        "httpOnly": True,
                    }
                ],
            }
        }


class VideoInfoRequest(BaseModel):
    """Request model for video info endpoint."""

    url: HttpUrl
    is_playlist: bool = False
    cookies: Optional[List[Cookie]] = None


class VideoInfoResponse(BaseModel):
    title: str
    duration: Optional[int]
    thumbnail: Optional[str]
    description: Optional[str]
    uploader: Optional[str]
    view_count: Optional[int]
    upload_date: Optional[str]
    is_playlist: bool
    entries: Optional[List[Dict]] = None


class FormatsResponse(BaseModel):
    is_playlist: bool
    formats: Optional[List[Dict]] = None
    entries: Optional[List[Dict]] = None


class FormatsRequest(BaseModel):
    """Request model for formats endpoint."""

    url: HttpUrl
    is_playlist: bool = False
    cookies: Optional[List[Cookie]] = None


class BrowserStatusResponse(BaseModel):
    browser: str
    is_available: bool
    message: str


class CookieStatusResponse(BaseModel):
    browser_cookies_available: bool
    client_cookies_supported: bool
    cookie_file_path: Optional[str] = None
    message: str


# Direct download mode only - no server storage needed


class CookieManager:
    """Manages cookie operations including storage and retrieval."""

    def __init__(self):
        self.cookie_dir = Path(COOKIE_DIR)
        self.cookie_dir.mkdir(exist_ok=True)
        self.cookie_expiry = timedelta(hours=COOKIE_EXPIRY_HOURS)

        # Clean up old cookie files on startup
        self._cleanup_old_cookie_files()

    def _cleanup_old_cookie_files(self):
        """Remove old cookie files."""
        try:
            expiry_time = datetime.now() - self.cookie_expiry
            count = 0
            for file in self.cookie_dir.glob("yt_dlp_cookies_*.txt"):
                if file.stat().st_mtime < expiry_time.timestamp():
                    file.unlink()
                    count += 1
            if count > 0:
                logger.info(f"Cleaned up {count} expired cookie files")
        except Exception as e:
            logger.warning(f"Error cleaning up cookie files: {e}")

    def create_cookie_file(self, cookies: List[Cookie], task_id: str = None) -> Path:
        """
        Create a Netscape format cookie file from a list of cookies.

        Args:
            cookies: List of Cookie objects
            task_id: Optional task ID to associate with the cookie file

        Returns:
            Path to the created cookie file
        """
        if not cookies:
            raise ValueError("No cookies provided")

        file_id = task_id or str(uuid.uuid4())
        cookie_file = self.cookie_dir / f"yt_dlp_cookies_{file_id}.txt"

        try:
            with open(cookie_file, "w") as f:
                f.write("# Netscape HTTP Cookie File\n")
                f.write("# This file was generated by renytdlp\n")
                f.write("# https://github.com/renbkna/renytdlp\n\n")

                for cookie in cookies:
                    # Format: domain, subdomain flag, path, secure flag, expiration, name, value
                    domain = cookie.domain
                    if not domain.startswith(".") and not domain.startswith("www."):
                        domain = "." + domain

                    # Default expiration to 1 year if not provided
                    expiration = int(cookie.expirationDate or (time.time() + 31536000))

                    # TRUE/FALSE for flags
                    http_only = "TRUE" if cookie.httpOnly else "FALSE"
                    secure = "TRUE" if cookie.secure else "FALSE"

                    # Write the cookie line
                    # domain, include subdomains, path, secure, expiry, name, value
                    f.write(
                        f"{domain}\tTRUE\t{cookie.path}\t{secure}\t{expiration}\t{cookie.name}\t{cookie.value}\n"
                    )

            logger.info(f"Created cookie file: {cookie_file}")
            return cookie_file
        except Exception as e:
            logger.error(f"Error creating cookie file: {e}")
            if cookie_file.exists():
                cookie_file.unlink()
            raise

    def delete_cookie_file(self, cookie_file: Path):
        """Delete a cookie file."""
        try:
            if cookie_file and cookie_file.exists():
                cookie_file.unlink()
                logger.info(f"Deleted cookie file: {cookie_file}")
        except Exception as e:
            logger.warning(f"Error deleting cookie file {cookie_file}: {e}")


# Initialize cookie manager
cookie_manager = CookieManager()


# Enhanced exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with better error messages."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP Error",
            "status_code": exc.status_code,
            "message": exc.detail,
            "path": request.url.path,
            "timestamp": datetime.now().isoformat(),
        },
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Handle validation errors."""
    logger.warning(f"Validation error: {str(exc)}")
    return JSONResponse(
        status_code=400,
        content={
            "error": "Validation Error",
            "status_code": 400,
            "message": str(exc),
            "path": request.url.path,
            "timestamp": datetime.now().isoformat(),
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Handle unexpected errors gracefully."""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "status_code": 500,
            "message": (
                "An unexpected error occurred. The issue has been logged."
                if not settings.debug
                else str(exc)
            ),
            "path": request.url.path,
            "timestamp": datetime.now().isoformat(),
        },
    )


def sanitize_url(url: str, is_playlist: bool) -> str:
    """Clean up URL by removing unnecessary parameters."""
    parsed = urlparse(url)
    query = parse_qs(parsed.query)
    # Remove unnecessary YouTube parameters
    for param in [
        "feature",
        "ab_channel",
        "si",
        "pp",
        "utm_source",
        "utm_medium",
        "utm_campaign",
    ]:
        query.pop(param, None)
    if not is_playlist:
        query.pop("list", None)
    return urlunparse(parsed._replace(query=urlencode(query, doseq=True)))


def check_browser_available(browser: str = DEFAULT_BROWSER) -> bool:
    """Check if a browser is available for cookie extraction."""
    try:
        # Use direct command execution to test if browser cookies can be extracted
        cmd = [
            "yt-dlp",
            "--cookies-from-browser",
            browser,
            "--skip-download",
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        ]
        result = subprocess.run(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=5, check=False
        )

        # Check if there was an error message about cookies database
        if result.returncode != 0 or "could not find" in result.stderr.decode(
            "utf-8", "ignore"
        ):
            # Only log as debug since this is expected on many systems
            logger.debug(
                f"Browser {browser} cookies not accessible: {result.stderr.decode('utf-8', 'ignore')}"
            )
            return False
        return True
    except Exception as e:
        logger.debug(f"Browser {browser} not available for cookie extraction: {str(e)}")
        return False


def get_yt_dlp_base_args(
    use_browser_cookies: bool, client_cookies: List[Cookie] = None, task_id: str = None
) -> tuple:
    """
    Get base yt-dlp command-line arguments for cookies.

    Args:
        use_browser_cookies: Whether to use browser cookies
        client_cookies: Optional client-provided cookies
        task_id: Task ID for cookie file management

    Returns:
        Tuple of (command args list, cookie file path or None)
    """
    args = []
    cookie_file = None

    # Try client cookies first if provided
    if client_cookies:
        try:
            cookie_file = cookie_manager.create_cookie_file(client_cookies, task_id)
            logger.info(f"Using client-provided cookies from file: {cookie_file}")
            args.extend(["--cookies", str(cookie_file)])
            return args, cookie_file
        except Exception as e:
            logger.warning(f"Failed to create cookie file from client cookies: {e}")

    # Fall back to browser cookies if requested and no client cookies were used
    if use_browser_cookies and DEFAULT_BROWSER:
        if check_browser_available(DEFAULT_BROWSER):
            logger.info(f"Using cookies from browser: {DEFAULT_BROWSER}")
            args.extend(["--cookies-from-browser", DEFAULT_BROWSER])
        else:
            logger.info(
                f"Browser cookies requested but {DEFAULT_BROWSER} is not available (this is normal on many systems)"
            )

    return args, cookie_file


def get_ytdlp_options(request: DownloadRequest, task_id: str) -> dict:
    """Generate yt-dlp options based on download request with premium quality support."""
    chosen_format = request.format

    # Smart audio extraction logic
    extract_audio_postprocessor = False
    if request.extract_audio:
        if chosen_format == "best" or chosen_format == "":
            # User wants to extract audio but didn't specify format - use bestaudio + convert
            chosen_format = "bestaudio"
            extract_audio_postprocessor = True
        else:
            # User selected a specific format
            # Check if it's a known audio-only format
            audio_only_formats = {
                "140",
                "141",
                "171",
                "250",
                "251",
                "249",
                "139",
                "138",
                "bestaudio",
                "worstaudio",
            }

            if chosen_format in audio_only_formats:
                # It's already audio-only, no need for post-processing
                # Just download the format directly
                extract_audio_postprocessor = False
                logger.info(
                    f"Using audio-only format {chosen_format} directly without post-processing"
                )
            else:
                # It's a video format, so we need to extract audio
                extract_audio_postprocessor = True
                logger.info(
                    f"Using video format {chosen_format} with audio extraction to {request.audio_format}"
                )

    # Log the final decision for debugging
    logger.info(
        f"Final format: {chosen_format}, Extract audio: {extract_audio_postprocessor}"
    )

    # Build output template with date-based organization
    now = datetime.now()
    date_path = now.strftime("%Y/%m/%d")
    output_dir = DOWNLOAD_DIR / task_id / date_path
    output_dir.mkdir(parents=True, exist_ok=True)

    # Extended headers to mimic a real YouTube client
    default_headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Sec-Fetch-Mode": "navigate",
        "Referer": "https://www.youtube.com/",
        "Origin": "https://www.youtube.com",
        "X-YouTube-Client-Name": "1",
        "X-YouTube-Client-Version": "2.20230816.00.00",
    }

    options = {
        "format": chosen_format,
        "outtmpl": str(output_dir / "%(title)s.%(ext)s"),
        "writethumbnail": request.embed_thumbnail or request.embed_thumbnail,
        "embedmetadata": request.embed_metadata,
        "noplaylist": not request.download_playlist,
        "extract_flat": "discard" if not request.download_playlist else None,
        "writesubtitles": request.download_subtitles,
        "subtitleslangs": (
            request.subtitle_languages if request.subtitle_languages else ["en"]
        ),
        "postprocessors": [],
        "sponsorblock_remove": "all" if request.sponsorblock else None,
        "quiet": False,
        "no_warnings": False,
        "verbose": True,
        "http_headers": default_headers,
        "hls_use_mpegts": True,
        "extractor_args": {
            "youtube": {"formats": "missing_pot"}
        },  # Get premium formats for YouTube
        "retries": 10,  # More retries for stability
        "fragment_retries": 10,
        "file_access_retries": 5,
        "sleep_interval_requests": 0.5,  # Wait between retries
        "socket_timeout": 30,  # Socket timeout
        "retry_sleep_functions": {"http": lambda n: 1.0 * (2 ** (n - 1))},
        "allow_unplayable_formats": True,  # Allow premium formats
        "check_formats": False,  # Don't skip formats that might not be playable
        "overwrites": True,  # Always overwrite existing files
        "continue_dl": False,  # Don't continue partial downloads
        "nopart": True,  # Don't use .part files
        "force_overwrites": True,  # Force overwrite even if file exists
        "cachedir": False,  # Disable caching to prevent conflicts
        "break_on_existing": False,  # CRITICAL: Don't skip downloads for existing files
        "download_archive": None,  # CRITICAL: Disable download archive completely
    }

    # Get cookie arguments - handle both client and browser cookies
    cookie_args, cookie_file = get_yt_dlp_base_args(
        request.use_browser_cookies, request.client_cookies, task_id
    )

    # Store cookie file path in options for cleanup
    if cookie_file:
        options["cookie_file"] = str(cookie_file)

    # Add cookie arguments to yt-dlp options
    if "--cookies" in cookie_args:
        options["cookies"] = cookie_args[cookie_args.index("--cookies") + 1]
    elif "--cookies-from-browser" in cookie_args:
        options["cookiesfrombrowser"] = (
            cookie_args[cookie_args.index("--cookies-from-browser") + 1],
            None,
            None,
            None,
        )

    # Extract audio if requested (only if we determined post-processing is needed)
    if extract_audio_postprocessor:
        options["postprocessors"].append(
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": request.audio_format or "mp3",
                "preferredquality": request.quality or "0",
            }
        )

    # Embed thumbnail if requested
    if request.embed_thumbnail:
        options["postprocessors"].append({"key": "EmbedThumbnail"})

    # Add chapters from comments if requested
    if request.chapters_from_comments:
        # Enable chapter extraction from comments
        options["writeinfojson"] = True
        options["writedescription"] = True
        options["extract_comments"] = True
        options["getcomments"] = True
        # Add postprocessor to extract chapters from comments/description
        options["postprocessors"].append(
            {"key": "FFmpegMetadata", "add_chapters": True, "add_metadata": True}
        )

    return options


def format_speed(speed_bytes: float) -> str:
    """Format download speed for display."""
    if speed_bytes < 1024:
        return f"{speed_bytes:.2f}B/s"
    elif speed_bytes < 1024 * 1024:
        return f"{speed_bytes / 1024:.2f}KB/s"
    elif speed_bytes < 1024 * 1024 * 1024:
        return f"{speed_bytes / (1024 * 1024):.2f}MB/s"
    else:
        return f"{speed_bytes / (1024 * 1024 * 1024):.2f}GB/s"


def format_size(size_bytes: float) -> str:
    """Format file size for display."""
    if size_bytes < 1024:
        return f"{size_bytes:.0f}B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f}KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f}MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.2f}GB"


def cleanup_cookie_file(options: dict):
    """Clean up any cookie file created for the download."""
    if "cookie_file" in options and options["cookie_file"]:
        try:
            cookie_file = Path(options["cookie_file"])
            if cookie_file.exists():
                cookie_file.unlink()
                logger.info(f"Cleaned up cookie file: {cookie_file}")
        except Exception as e:
            logger.warning(f"Error cleaning up cookie file: {e}")


@app.post("/api/cookies", response_model=CookieStatusResponse)
async def upload_cookies(cookies: CookieUpload):
    """
    Upload cookies from the client browser to be used for video downloads.
    This is particularly useful for age-restricted videos on YouTube.
    """
    try:
        # Validate cookies
        if not cookies.cookies or len(cookies.cookies) == 0:
            return CookieStatusResponse(
                browser_cookies_available=check_browser_available(DEFAULT_BROWSER),
                client_cookies_supported=True,
                message="No cookies provided",
            )

        # Create a test cookie file to verify
        test_id = f"test_{uuid.uuid4()}"
        cookie_file = cookie_manager.create_cookie_file(cookies.cookies, test_id)

        # Clean up test file
        cookie_manager.delete_cookie_file(cookie_file)

        return CookieStatusResponse(
            browser_cookies_available=check_browser_available(DEFAULT_BROWSER),
            client_cookies_supported=True,
            message=f"Successfully processed {len(cookies.cookies)} cookies",
        )
    except Exception as e:
        logger.error(f"Error processing uploaded cookies: {e}")
        return CookieStatusResponse(
            browser_cookies_available=check_browser_available(DEFAULT_BROWSER),
            client_cookies_supported=True,
            message=f"Error processing cookies: {str(e)}",
        )


# Helper functions for streaming downloads
def sanitize_filename(filename: str) -> str:
    """Remove invalid characters from filename."""
    # Remove invalid filename characters
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        filename = filename.replace(char, "_")

    # Remove extra spaces and truncate if too long
    filename = " ".join(filename.split())
    return filename[:100] if len(filename) > 100 else filename


def get_extension_from_format(
    format_code: str, extract_audio: bool, audio_format: str
) -> str:
    """Determine file extension based on format selection."""
    if extract_audio:
        return audio_format or "mp3"

    # Common video format mappings
    format_extensions = {
        "18": "mp4",  # 360p MP4
        "22": "mp4",  # 720p MP4
        "137": "mp4",  # 1080p MP4
        "best": "mp4",
        "worst": "mp4",
        "bestvideo": "mp4",
        "bestaudio": "m4a",
    }

    return format_extensions.get(format_code, "mp4")


def get_content_type(extension: str) -> str:
    """Get MIME type for file extension."""
    content_types = {
        "mp4": "video/mp4",
        "webm": "video/webm",
        "mkv": "video/x-matroska",
        "avi": "video/x-msvideo",
        "mp3": "audio/mpeg",
        "m4a": "audio/mp4",
        "ogg": "audio/ogg",
        "wav": "audio/wav",
    }
    return content_types.get(extension, "application/octet-stream")


def get_streaming_ytdlp_options(request: DownloadRequest, task_id: str) -> dict:
    """Generate yt-dlp options for streaming downloads."""
    chosen_format = request.format

    # Smart audio extraction logic (same as main function)
    extract_audio_postprocessor = False
    if request.extract_audio:
        if chosen_format == "best" or chosen_format == "":
            # User wants to extract audio but didn't specify format - use bestaudio + convert
            chosen_format = "bestaudio"
            extract_audio_postprocessor = True
        else:
            # User selected a specific format
            # Check if it's a known audio-only format
            audio_only_formats = {
                "140",
                "141",
                "171",
                "250",
                "251",
                "249",
                "139",
                "138",
                "bestaudio",
                "worstaudio",
            }

            if chosen_format in audio_only_formats:
                # It's already audio-only, no need for post-processing
                extract_audio_postprocessor = False
                logger.info(
                    f"Streaming: Using audio-only format {chosen_format} directly"
                )
            else:
                # It's a video format, so we need to extract audio
                extract_audio_postprocessor = True
                logger.info(
                    f"Streaming: Using video format {chosen_format} with audio extraction"
                )

    logger.info(
        f"Streaming final format: {chosen_format}, Extract audio: {extract_audio_postprocessor}"
    )

    options = {
        "format": chosen_format,
        "quiet": False,
        "no_warnings": False,
        "retries": 3,
        "fragment_retries": 3,
        "socket_timeout": 30,
        "postprocessors": [],
        "overwrites": True,  # Always overwrite existing files
        "continue_dl": False,  # Don't continue partial downloads
        "nopart": True,  # Don't use .part files
        "force_overwrites": True,  # Force overwrite even if file exists
        "no_check_certificate": False,  # Keep certificate checks
        "cachedir": False,  # Disable caching to prevent conflicts
        "break_on_existing": False,  # CRITICAL: Don't skip downloads for existing files
        "download_archive": None,  # CRITICAL: Disable download archive completely
    }

    # Get cookie arguments
    cookie_args, cookie_file = get_yt_dlp_base_args(
        request.use_browser_cookies, request.client_cookies, task_id
    )

    # Add cookie arguments to options
    if "--cookies" in cookie_args:
        options["cookies"] = cookie_args[cookie_args.index("--cookies") + 1]
    elif "--cookies-from-browser" in cookie_args:
        options["cookiesfrombrowser"] = (
            cookie_args[cookie_args.index("--cookies-from-browser") + 1],
            None,
            None,
            None,
        )

    # Extract audio if requested (only if we determined post-processing is needed)
    if extract_audio_postprocessor:
        options["postprocessors"].append(
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": request.audio_format or "mp3",
                "preferredquality": request.quality or "0",
            }
        )

    return options


@app.post("/api/download/stream")
async def stream_download(
    request: DownloadRequest,
    auth: Optional[str] = Depends(api_key_auth),
):
    """Stream download directly to user without server storage."""
    # Enhanced security validation
    validated_url = SecurityValidator.validate_url(str(request.url))

    # Validate cookies if provided
    if request.client_cookies:
        cookie_dicts = [cookie.dict() for cookie in request.client_cookies]
        validated_cookies = SecurityValidator.validate_cookie_data(cookie_dicts)
        request.client_cookies = [Cookie(**cookie) for cookie in validated_cookies]

    task_id = str(uuid.uuid4())
    logger.info(f"Starting streaming download {task_id} for URL: {validated_url}")

    # Get yt-dlp options for streaming
    options = get_streaming_ytdlp_options(request, task_id)

    # Get video info first to determine filename and content type
    try:
        with yt_dlp.YoutubeDL({"quiet": True, "no_warnings": True}) as ydl:
            info = await asyncio.get_running_loop().run_in_executor(
                None, lambda: ydl.extract_info(str(validated_url), download=False)
            )

        # Determine filename and content type based on format
        filename = info.get("title", "download")
        ext = get_extension_from_format(
            request.format, request.extract_audio, request.audio_format
        )
        safe_filename = f"{sanitize_filename(filename)}.{ext}"
        content_type = get_content_type(ext)

        logger.info(f"Streaming {safe_filename} as {content_type}")

        # Create streaming generator
        async def download_generator():
            temp_dir = None
            try:
                # Create temporary directory for download
                temp_dir = tempfile.mkdtemp()

                # Set output template with proper extension
                if request.extract_audio:
                    # For audio extraction, let yt-dlp handle the extension after post-processing
                    output_template = os.path.join(
                        temp_dir, f"{sanitize_filename(filename)}.%(ext)s"
                    )
                else:
                    # For video, use the determined extension
                    output_template = os.path.join(temp_dir, safe_filename)

                options["outtmpl"] = output_template

                logger.info(f"Downloading to: {output_template}")
                logger.info(f"Options: {options}")

                with yt_dlp.YoutubeDL(options) as ydl:
                    await asyncio.get_running_loop().run_in_executor(
                        None, lambda: ydl.download([str(validated_url)])
                    )

                # Find the actual downloaded file(s)
                downloaded_files = []
                for file_path in os.listdir(temp_dir):
                    full_path = os.path.join(temp_dir, file_path)
                    if os.path.isfile(full_path) and os.path.getsize(full_path) > 0:
                        downloaded_files.append(full_path)

                if not downloaded_files:
                    raise Exception("No valid files were downloaded")

                # Use the first (and usually only) downloaded file
                download_path = downloaded_files[0]
                actual_filename = os.path.basename(download_path)

                logger.info(
                    f"Found downloaded file: {actual_filename} ({os.path.getsize(download_path)} bytes)"
                )

                # Update filename and content type based on actual file
                actual_ext = os.path.splitext(actual_filename)[1][1:]  # Remove the dot
                if actual_ext:
                    content_type = get_content_type(actual_ext)

                # Stream the file back
                with open(download_path, "rb") as f:
                    while chunk := f.read(8192):  # 8KB chunks
                        yield chunk

            except Exception as e:
                logger.error(f"Error in download generator: {e}")
                error_msg = f"Download failed: {str(e)}"
                yield error_msg.encode("utf-8")
            finally:
                # Clean up temp directory and all files
                if temp_dir and os.path.exists(temp_dir):
                    try:
                        shutil.rmtree(temp_dir)
                        logger.info(f"Cleaned up temp directory: {temp_dir}")
                    except Exception as e:
                        logger.warning(f"Failed to clean up temp directory: {e}")

        # We need to determine the actual filename after download, so let's create a wrapper
        actual_filename = safe_filename
        actual_content_type = content_type

        async def filename_aware_generator():
            nonlocal actual_filename, actual_content_type
            temp_dir = None
            try:
                # Create unique temporary directory for download
                temp_dir = tempfile.mkdtemp(prefix=f"ytdlp_stream_{task_id}_")

                # Set output template with proper extension and unique ID to prevent conflicts
                unique_id = str(uuid.uuid4())[:8]  # 8-character unique ID
                if request.extract_audio:
                    # For audio extraction, let yt-dlp handle the extension after post-processing
                    output_template = os.path.join(
                        temp_dir, f"{sanitize_filename(filename)}_{unique_id}.%(ext)s"
                    )
                else:
                    # For video, use the determined extension with unique ID
                    base_name, ext = os.path.splitext(safe_filename)
                    output_template = os.path.join(
                        temp_dir, f"{base_name}_{unique_id}{ext}"
                    )

                options["outtmpl"] = output_template

                logger.info(f"Downloading to: {output_template}")
                logger.info(f"Options: {options}")

                with yt_dlp.YoutubeDL(options) as ydl:
                    await asyncio.get_running_loop().run_in_executor(
                        None, lambda: ydl.download([str(validated_url)])
                    )

                logger.info(
                    f"Download command completed for temp directory: {temp_dir}"
                )

                # Find the actual downloaded file(s)
                downloaded_files = []
                for file_path in os.listdir(temp_dir):
                    full_path = os.path.join(temp_dir, file_path)
                    if os.path.isfile(full_path) and os.path.getsize(full_path) > 0:
                        downloaded_files.append(full_path)

                logger.info(f"Found {len(downloaded_files)} valid downloaded files")
                for file_path in downloaded_files:
                    logger.info(
                        f"  - {os.path.basename(file_path)}: {os.path.getsize(file_path)} bytes"
                    )

                if not downloaded_files:
                    # List all files in directory for debugging
                    all_files = []
                    for file_path in os.listdir(temp_dir):
                        full_path = os.path.join(temp_dir, file_path)
                        if os.path.isfile(full_path):
                            all_files.append(
                                f"{file_path} ({os.path.getsize(full_path)} bytes)"
                            )

                    logger.error(
                        f"No valid files downloaded. All files in temp dir: {all_files}"
                    )
                    raise Exception(
                        f"No valid files were downloaded. Found files: {all_files}"
                    )

                # Use the first (and usually only) downloaded file
                download_path = downloaded_files[0]
                actual_filename = os.path.basename(download_path)

                logger.info(
                    f"Found downloaded file: {actual_filename} ({os.path.getsize(download_path)} bytes)"
                )

                # Update content type based on actual file
                actual_ext = os.path.splitext(actual_filename)[1][1:]  # Remove the dot
                if actual_ext:
                    actual_content_type = get_content_type(actual_ext)

                # Stream the file back
                with open(download_path, "rb") as f:
                    while chunk := f.read(8192):  # 8KB chunks
                        yield chunk

            except Exception as e:
                logger.error(f"Error in download: {e}")
                error_msg = f"Download failed: {str(e)}"
                yield error_msg.encode("utf-8")
            finally:
                # Clean up temp directory and all files
                if temp_dir and os.path.exists(temp_dir):
                    try:
                        shutil.rmtree(temp_dir)
                        logger.info(f"Cleaned up temp directory: {temp_dir}")
                    except Exception as e:
                        logger.warning(f"Failed to clean up temp directory: {e}")

        return StreamingResponse(
            filename_aware_generator(),
            media_type=actual_content_type,
            headers={
                "Content-Disposition": f'attachment; filename="{actual_filename}"',
                "Content-Type": actual_content_type,
            },
        )

    except Exception as e:
        logger.exception(f"Error in streaming download {task_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


@app.get("/api/health")
async def health_check():
    """Health check endpoint for monitoring."""
    # Check disk space (temp directory for streaming)
    temp_dir = Path(tempfile.gettempdir())
    download_dir_stat = os.statvfs(temp_dir)
    free_space_gb = (download_dir_stat.f_frsize * download_dir_stat.f_bavail) / (
        1024**3
    )

    # Check if yt-dlp is working
    ytdlp_healthy = True
    try:
        result = subprocess.run(
            ["yt-dlp", "--version"], capture_output=True, text=True, timeout=5
        )
        ytdlp_version = result.stdout.strip() if result.returncode == 0 else "unknown"
    except Exception:
        ytdlp_healthy = False
        ytdlp_version = "error"

    health_status = {
        "status": "healthy" if ytdlp_healthy and free_space_gb > 1 else "unhealthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.1",
        "mode": "direct_download_only",
        "ytdlp_version": ytdlp_version,
        "ytdlp_healthy": ytdlp_healthy,
        "free_space_gb": round(free_space_gb, 2),
        "config": {
            "max_requests_per_minute": settings.max_requests_per_minute,
            "default_browser": settings.default_browser,
        },
    }

    status_code = 200 if health_status["status"] == "healthy" else 503
    return JSONResponse(content=health_status, status_code=status_code)


@app.get("/api/metrics")
async def get_metrics():
    """Get application metrics for monitoring."""
    # Get system info
    try:
        import psutil

        cpu_percent = psutil.cpu_percent()
        memory_info = psutil.virtual_memory()
        disk_info = psutil.disk_usage(tempfile.gettempdir())
    except ImportError:
        # Fallback if psutil not available
        cpu_percent = None
        memory_info = None
        disk_info = None

    metrics = {
        "timestamp": datetime.now().isoformat(),
        "mode": "direct_download_only",
        "system_metrics": {
            "cpu_percent": cpu_percent,
            "memory_percent": memory_info.percent if memory_info else None,
            "memory_used_gb": (
                round(memory_info.used / (1024**3), 2) if memory_info else None
            ),
            "disk_free_gb": round(disk_info.free / (1024**3), 2) if disk_info else None,
            "disk_used_percent": (
                round((disk_info.used / disk_info.total) * 100, 1)
                if disk_info
                else None
            ),
        },
        "configuration": {
            "max_requests_per_minute": settings.max_requests_per_minute,
            "max_file_size_gb": settings.max_file_size_gb,
            "cleanup_after_days": settings.cleanup_after_days,
        },
    }

    return metrics


# History endpoint removed - database no longer available


# Analytics endpoint removed - database no longer available


# Failed downloads endpoint removed - database no longer available


# Preferences endpoints removed - database no longer available


@app.post("/api/info", response_model=VideoInfoResponse)
async def get_video_info_with_cookies(request: VideoInfoRequest):
    """
    Get information about a video or playlist with cookies provided directly in the request body.
    This is an alternative POST endpoint to the GET /api/info that allows direct cookie submission.
    """
    return await _get_video_info(request.url, request.is_playlist, request.cookies)


@app.get("/api/info", response_model=VideoInfoResponse)
async def get_video_info(
    url: HttpUrl,
    is_playlist: bool = Query(False),
    client_cookies: Optional[List[Dict]] = None,
):
    """Get information about a video or playlist."""
    # Convert client cookies if provided in query
    cookies_list = None
    if client_cookies:
        try:
            cookies_list = [Cookie(**cookie) for cookie in client_cookies]
        except Exception as e:
            logger.warning(f"Failed to parse client cookies: {e}")

    return await _get_video_info(url, is_playlist, cookies_list)


async def _get_video_info(
    url: HttpUrl,
    is_playlist: bool = False,
    client_cookies: Optional[List[Cookie]] = None,
):
    """Internal function to get video info, used by both GET and POST endpoints."""
    start_time = time.time()
    cookie_file = None

    try:
        clean_url = sanitize_url(str(url), is_playlist)
        logger.info(f"Fetching video info for URL: {clean_url}")

        if client_cookies:
            logger.info(
                f"Using {len(client_cookies)} client-provided cookies for video info"
            )

        # Basic yt-dlp options
        options = {
            "noplaylist": not is_playlist,
            "extract_flat": "discard" if not is_playlist else None,
            "quiet": True,
            "no_warnings": True,
            "download": False,
        }

        # Get cookie arguments - handle both client and browser cookies
        cookie_args, cookie_file = get_yt_dlp_base_args(True, client_cookies)

        # Add cookie arguments to yt-dlp options
        if "--cookies" in cookie_args:
            options["cookies"] = cookie_args[cookie_args.index("--cookies") + 1]
            logger.info(f"Using cookie file: {options['cookies']}")
        elif "--cookies-from-browser" in cookie_args:
            options["cookiesfrombrowser"] = (
                cookie_args[cookie_args.index("--cookies-from-browser") + 1],
                None,
                None,
                None,
            )
            logger.info(f"Using browser cookies: {options['cookiesfrombrowser'][0]}")

        # Direct subprocess call with cookies for maximum compatibility
        try:
            # First try direct subprocess call with cookies for maximum compatibility
            cmd = ["yt-dlp", "--dump-json", "--no-warnings", "--quiet"]
            if not is_playlist:
                cmd.append("--no-playlist")

            # Add cookie arguments
            cmd.extend(cookie_args)
            cmd.append(clean_url)

            logger.info(f"Running command: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)

            # Parse the JSON output
            import json

            info = json.loads(result.stdout)

            duration = time.time() - start_time
            logger.info(f"Video info fetched via subprocess in {duration:.2f} seconds")
        except subprocess.CalledProcessError as e:
            logger.error(f"Subprocess error: {e.stderr}")

            # Fall back to using the yt-dlp Python API
            logger.info("Falling back to yt-dlp Python API")
            with yt_dlp.YoutubeDL(options) as ydl:
                info = await asyncio.get_running_loop().run_in_executor(
                    None, lambda: ydl.extract_info(clean_url, download=False)
                )

                duration = time.time() - start_time
                logger.info(
                    f"Video info fetched via Python API in {duration:.2f} seconds"
                )

        # Handle playlists
        is_playlist_result = "entries" in info
        entries = info.get("entries", [])[:50] if is_playlist_result else None

        # Extract simplified entry data for playlists
        if entries:
            simplified_entries = []
            for entry in entries:
                simplified_entries.append(
                    {
                        "id": entry.get("id", ""),
                        "title": entry.get("title", "Untitled"),
                        "duration": entry.get("duration"),
                        "thumbnail": entry.get("thumbnail"),
                    }
                )
            entries = simplified_entries

        return VideoInfoResponse(
            title=info.get("title", "Untitled"),
            duration=info.get("duration"),
            thumbnail=info.get("thumbnail"),
            description=info.get("description"),
            uploader=info.get("uploader"),
            view_count=info.get("view_count"),
            upload_date=info.get("upload_date"),
            is_playlist=is_playlist_result,
            entries=entries,
        )

    except Exception as e:
        logger.exception(f"Error fetching video info: {str(e)}")

        # Check if this is a YouTube authentication error
        error_message = str(e)
        if "Sign in to confirm you're not a bot" in error_message:
            browser_status = check_browser_available(DEFAULT_BROWSER)
            additional_info = f"\nBrowser {DEFAULT_BROWSER} {'is' if browser_status else 'is not'} available for cookies."
            additional_info += (
                "\nConsider providing client-side cookies for authentication."
            )
            raise HTTPException(status_code=400, detail=error_message + additional_info)

        # For TikTok/Instagram videos, try to extract minimal info
        clean_url = sanitize_url(str(url), is_playlist)
        is_tiktok = "tiktok.com" in clean_url.lower()
        is_instagram = "instagram.com" in clean_url.lower()

        if is_tiktok or is_instagram:
            # Extract minimal info from URL
            parsed_url = urlparse(clean_url)
            video_id = None

            # Extract video ID and username from path
            if is_tiktok:
                # Try to extract from TikTok URL using pattern: /@username/video/12345
                path_parts = parsed_url.path.strip("/").split("/")
                username = None
                for i, part in enumerate(path_parts):
                    if (
                        part.startswith("@")
                        and i + 2 < len(path_parts)
                        and path_parts[i + 1] == "video"
                    ):
                        username = part[1:]  # Remove @ prefix
                        video_id = path_parts[i + 2]
                        break

                title = f"TikTok video by @{username or 'user'}"
            else:
                # For Instagram, similar approach
                video_id = parsed_url.path.split("/")[-1]
                title = "Instagram content"

            # Return minimal info
            return VideoInfoResponse(
                title=title,
                duration=None,
                thumbnail=None,
                description=None,
                uploader=None,
                view_count=None,
                upload_date=None,
                is_playlist=False,
                entries=None,
            )

        # For other platforms, just propagate the error
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        # Clean up any cookie files
        if cookie_file:
            try:
                cookie_manager.delete_cookie_file(Path(cookie_file))
            except Exception as e:
                logger.warning(f"Error cleaning up cookie file: {e}")


@app.post("/api/formats", response_model=FormatsResponse)
async def get_formats_with_cookies(request: FormatsRequest):
    """
    Get available formats for a video or playlist with cookies provided directly in the request body.
    This is an alternative POST endpoint to the GET /api/formats that allows direct cookie submission.
    """
    return await _get_formats(request.url, request.is_playlist, request.cookies)


@app.get("/api/formats", response_model=FormatsResponse)
async def get_formats(
    url: HttpUrl,
    is_playlist: bool = Query(False),
    client_cookies: Optional[List[Dict]] = None,
):
    """Get available formats for a video or playlist with premium quality options."""
    # Convert client cookies if provided in query
    cookies_list = None
    if client_cookies:
        try:
            cookies_list = [Cookie(**cookie) for cookie in client_cookies]
        except Exception as e:
            logger.warning(f"Failed to parse client cookies: {e}")

    return await _get_formats(url, is_playlist, cookies_list)


async def _get_formats(
    url: HttpUrl,
    is_playlist: bool = False,
    client_cookies: Optional[List[Cookie]] = None,
):
    """Internal function to get formats, used by both GET and POST endpoints."""
    start_time = time.time()
    cookie_file = None

    try:
        clean_url = sanitize_url(str(url), is_playlist)
        logger.info(f"Fetching formats for URL: {clean_url}")

        if client_cookies:
            logger.info(
                f"Using {len(client_cookies)} client-provided cookies for formats"
            )

        # Basic yt-dlp options
        options = {
            "noplaylist": not is_playlist,
            "extract_flat": "discard" if not is_playlist else None,
            "quiet": True,
            "no_warnings": True,
            "download": False,
            "allow_unplayable_formats": True,  # Allow premium formats to be listed
            "check_formats": False,  # Don't skip unplayable formats
            "extractor_args": {
                "youtube": {"formats": "missing_pot"}
            },  # Get premium formats for YouTube
        }

        # Get cookie arguments - handle both client and browser cookies
        cookie_args, cookie_file = get_yt_dlp_base_args(True, client_cookies)

        # Add cookie arguments to yt-dlp options
        if "--cookies" in cookie_args:
            options["cookies"] = cookie_args[cookie_args.index("--cookies") + 1]
        elif "--cookies-from-browser" in cookie_args:
            options["cookiesfrombrowser"] = (
                cookie_args[cookie_args.index("--cookies-from-browser") + 1],
                None,
                None,
                None,
            )

        # Use direct subprocess call first for best compatibility
        try:
            # First try direct subprocess call with cookies for maximum compatibility
            cmd = [
                "yt-dlp",
                "--dump-json",
                "--no-warnings",
                "--quiet",
                "--list-formats",
            ]
            if not is_playlist:
                cmd.append("--no-playlist")

            # Add cookie arguments
            cmd.extend(cookie_args)
            cmd.append(clean_url)

            logger.info(f"Running command: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)

            # Use the yt-dlp Python API for parsing formats as it's more reliable
            with yt_dlp.YoutubeDL(options) as ydl:
                info = await asyncio.get_running_loop().run_in_executor(
                    None, lambda: ydl.extract_info(clean_url, download=False)
                )

            duration = time.time() - start_time
            logger.info(f"Formats fetched in {duration:.2f} seconds")
        except subprocess.CalledProcessError:
            # Fall back to using the yt-dlp Python API
            logger.info("Falling back to yt-dlp Python API for formats")
            with yt_dlp.YoutubeDL(options) as ydl:
                info = await asyncio.get_running_loop().run_in_executor(
                    None, lambda: ydl.extract_info(clean_url, download=False)
                )

            duration = time.time() - start_time
            logger.info(f"Formats fetched via Python API in {duration:.2f} seconds")

        # Filter and clean up formats for better display
        formats = []
        if "formats" in info:
            for fmt in info.get("formats", []):
                # Skip storyboard formats
                if fmt.get("format_note") == "storyboard" or fmt.get(
                    "format_id", ""
                ).startswith("sb"):
                    continue

                # Calculate filesize if not available but we have bitrate and duration
                if not fmt.get("filesize") and fmt.get("tbr") and info.get("duration"):
                    fmt["filesize"] = int((fmt["tbr"] * 1024 / 8) * info["duration"])

                # Mark premium formats explicitly for client-side filtering
                if fmt.get("format_note") and any(
                    note in fmt.get("format_note").lower()
                    for note in ["premium", "4320p", "8k", "dolby", "hdr"]
                ):
                    fmt["is_premium"] = True

                # For TikTok/Instagram, ensure resolution is properly parsed for best quality detection
                if not fmt.get("height") and fmt.get("resolution"):
                    # Extract height from resolution string (e.g., "1280x720" -> 720)
                    resolution_match = re.search(
                        r"(\d+)x(\d+)", fmt.get("resolution", "")
                    )
                    if resolution_match:
                        fmt["width"] = int(resolution_match.group(1))
                        fmt["height"] = int(resolution_match.group(2))

                formats.append(fmt)

        return FormatsResponse(
            is_playlist="entries" in info,
            formats=formats,
            entries=info.get("entries", [])[:50] if "entries" in info else None,
        )
    except Exception as e:
        logger.exception(f"Error fetching formats: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        # Clean up any cookie files
        if cookie_file:
            try:
                cookie_manager.delete_cookie_file(Path(cookie_file))
            except Exception as e:
                logger.warning(f"Error cleaning up cookie file: {e}")


@app.get("/api/browser_status", response_model=BrowserStatusResponse)
async def get_browser_status():
    """Check if a browser is available for cookie extraction."""
    browser = DEFAULT_BROWSER
    is_available = check_browser_available(browser)

    # Try to get additional info about the browser
    browser_info = ""
    try:
        if browser == "chrome" or browser == "chromium":
            cmd = ["google-chrome", "--version"]
            result = subprocess.run(cmd, capture_output=True, text=True, check=False)
            if result.returncode == 0:
                browser_info = result.stdout.strip()
    except:
        pass

    message = (
        f"Browser '{browser}' is available for cookie extraction{': ' + browser_info if browser_info else ''}"
        if is_available
        else f"Browser '{browser}' is not available for cookie extraction"
    )

    return BrowserStatusResponse(
        browser=browser, is_available=is_available, message=message
    )


@app.get("/api/cookie_status", response_model=CookieStatusResponse)
async def get_cookie_status():
    """Get status information about available cookie options."""
    browser_available = check_browser_available(DEFAULT_BROWSER)

    message = "Both client-side and browser cookies are supported."
    if not browser_available:
        message = f"Browser {DEFAULT_BROWSER} is not available. Client-side cookies are recommended."

    return CookieStatusResponse(
        browser_cookies_available=browser_available,
        client_cookies_supported=True,
        message=message,
    )


@app.get("/")
async def root():
    """API root endpoint."""
    # Check browser and cookie availability for better error messages
    browser_available = check_browser_available(DEFAULT_BROWSER)
    browser_status_message = (
        f"Browser {DEFAULT_BROWSER} is available for cookie extraction"
        if browser_available
        else f"Browser {DEFAULT_BROWSER} is not available for cookie extraction"
    )

    logger.info(browser_status_message)

    return {
        "message": "YT-DLP API is running",
        "version": "1.0.0",
        "documentation": "/docs",
        "cookie_status": {
            "browser_cookies_available": browser_available,
            "client_cookies_supported": True,
            "message": "Client-side cookies are supported for authentication.",
        },
        "browser_status": {
            "browser": DEFAULT_BROWSER,
            "is_available": browser_available,
            "message": browser_status_message,
        },
    }


if __name__ == "__main__":
    import uvicorn

    logger.info("Starting YT-DLP API server...")
    logger.info(f"Debug mode: {settings.debug}")
    logger.info(f"Allowed origins: {settings.allowed_origins}")

    try:
        uvicorn.run(
            app,
            host=settings.host,
            port=settings.port,
            log_level=settings.log_level.lower(),
            access_log=settings.debug,
        )
    except KeyboardInterrupt:
        logger.info("Received shutdown signal")
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        raise
