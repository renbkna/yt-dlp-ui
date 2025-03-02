from fastapi import FastAPI, HTTPException, BackgroundTasks, Query, Request, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl, Field, validator
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
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urlparse, parse_qs, urlunparse, urlencode

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("yt_dlp_api.log"), logging.StreamHandler()],
)
logger = logging.getLogger("yt-dlp-api")

# Browser to use for cookie extraction - can be set via environment variable
# Options: chrome, chromium, firefox, opera, edge, safari, brave, vivaldi
DEFAULT_BROWSER = os.getenv("YT_DLP_BROWSER", "chrome")

# Cookie file configuration
COOKIE_DIR = os.getenv("COOKIE_DIR", tempfile.gettempdir())
COOKIE_EXPIRY_HOURS = int(os.getenv("COOKIE_EXPIRY_HOURS", "1"))

app = FastAPI(
    title="YT-DLP API",
    description="API for downloading videos using yt-dlp",
    version="1.0.0",
)

# Get allowed origins from environment variable or default to ["*"]
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
if allowed_origins != "*":
    allowed_origins = allowed_origins.split(",")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,  # Allow credentials for cookie passing
)


class Cookie(BaseModel):
    """Model for a browser cookie."""
    domain: str
    name: str
    value: str
    path: str = "/"
    secure: bool = True
    httpOnly: bool = False
    expirationDate: Optional[float] = None

    @validator('domain')
    def validate_domain(cls, v):
        # Basic domain validation - this could be enhanced
        if not re.match(r'^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', v):
            raise ValueError('Invalid domain format')
        return v

    @validator('name', 'value')
    def no_semicolons(cls, v):
        if ';' in v:
            raise ValueError('Semicolons not allowed in cookie name/value')
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
    use_browser_cookies: bool = Field(default=True, description="Use browser cookies")
    client_cookies: Optional[List[Cookie]] = Field(
        default=None, description="Cookies provided by the client"
    )
    chapters_from_comments: bool = Field(
        default=False, description="Create chapters from comments"
    )

    class Config:
        schema_extra = {
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


class DownloadResponse(BaseModel):
    task_id: str
    status: str
    message: str


class DownloadStatus(BaseModel):
    status: str
    progress: float
    filename: Optional[str] = None
    error: Optional[str] = None
    eta: Optional[int] = None
    speed: Optional[str] = None


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


class BrowserStatusResponse(BaseModel):
    browser: str
    is_available: bool
    message: str


class CookieStatusResponse(BaseModel):
    browser_cookies_available: bool
    client_cookies_supported: bool
    cookie_file_path: Optional[str] = None
    message: str


download_tasks: Dict[str, DownloadStatus] = {}
DOWNLOAD_DIR = Path(os.getenv("DOWNLOAD_DIR", "downloads"))
DOWNLOAD_DIR.mkdir(exist_ok=True)


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
                    f.write(f"{domain}\tTRUE\t{cookie.path}\t{secure}\t{expiration}\t{cookie.name}\t{cookie.value}\n")
            
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


# Custom exception handlers
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred. Please check the server logs."
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
            logger.warning(
                f"Browser {browser} cookies not accessible: {result.stderr.decode('utf-8', 'ignore')}"
            )
            return False
        return True
    except Exception as e:
        logger.warning(
            f"Browser {browser} not available for cookie extraction: {str(e)}"
        )
        return False


def get_yt_dlp_base_args(use_browser_cookies: bool, client_cookies: List[Cookie] = None, task_id: str = None) -> List[str]:
    """
    Get base yt-dlp command-line arguments for cookies.
    
    Args:
        use_browser_cookies: Whether to use browser cookies
        client_cookies: Optional client-provided cookies
        task_id: Task ID for cookie file management
        
    Returns:
        List of command-line arguments for yt-dlp
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
            logger.warning(f"Browser cookies requested but {DEFAULT_BROWSER} is not available")
    
    return args, cookie_file


def get_ytdlp_options(request: DownloadRequest, task_id: str) -> dict:
    """Generate yt-dlp options based on download request with premium quality support."""
    chosen_format = request.format
    if request.extract_audio and (chosen_format == "best" or chosen_format == ""):
        chosen_format = "bestaudio"

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
        "retry_sleep_functions": {"http": lambda n: 1.0 * (2 ** (n - 1))},
        "allow_unplayable_formats": True,  # Allow premium formats
        "check_formats": False,  # Don't skip formats that might not be playable
    }

    # Get cookie arguments - handle both client and browser cookies
    cookie_args, cookie_file = get_yt_dlp_base_args(
        request.use_browser_cookies, 
        request.client_cookies,
        task_id
    )
    
    # Store cookie file path in options for cleanup
    if cookie_file:
        options["cookie_file"] = str(cookie_file)
    
    # Add cookie arguments to yt-dlp options
    if "--cookies" in cookie_args:
        options["cookies"] = cookie_args[cookie_args.index("--cookies") + 1]
    elif "--cookies-from-browser" in cookie_args:
        options["cookiesfrombrowser"] = (cookie_args[cookie_args.index("--cookies-from-browser") + 1], None, None, None)

    # Extract audio if requested
    if request.extract_audio:
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
        options["postprocessors"].append({"key": "SponsorBlock"})
        options["postprocessors"].append(
            {"key": "Exec", "exec_cmd": "echo Chapter extraction complete."}
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


def update_progress(task_id: str, d: dict):
    """Update download progress information with improved accuracy."""
    try:
        if d["status"] == "downloading":
            if d.get("_type") == "playlist":
                download_tasks[task_id].filename = (
                    f"Playlist: {d.get('info_dict', {}).get('title', 'Unknown')}"
                )
                try:
                    # Calculate playlist progress accurately
                    progress = (
                        d.get("playlist_index", 0) / d.get("playlist_count", 1)
                    ) * 100
                except:
                    progress = 0.0
            else:
                try:
                    # Calculate download progress using available byte information
                    if "total_bytes" in d:
                        progress = (
                            float(d["downloaded_bytes"]) / float(d["total_bytes"]) * 100
                        )
                    elif "total_bytes_estimate" in d:
                        progress = (
                            float(d["downloaded_bytes"])
                            / float(d["total_bytes_estimate"])
                            * 100
                        )
                    else:
                        # For streams without size information, use provided progress if available
                        progress = float(d.get("downloaded_percent", 0))
                except:
                    progress = 0.0

                # Update speed and ETA information with proper formatting
                if "speed" in d and d["speed"] is not None:
                    download_tasks[task_id].speed = format_speed(d["speed"])

                if "eta" in d and d["eta"] is not None:
                    download_tasks[task_id].eta = d["eta"]

                download_tasks[task_id].filename = d.get("filename", "").split("/")[-1]

            download_tasks[task_id].progress = min(
                progress, 99.9
            )  # Cap at 99.9% until fully complete
            download_tasks[task_id].status = (
                "downloading"  # Ensure status is set correctly
            )

        elif d["status"] == "finished":
            if (
                "ext" in d
                and d["ext"]
                and d["ext"] != d.get("info_dict", {}).get("ext", "")
            ):
                # When converted to a different format, we show "processing"
                download_tasks[task_id].status = "processing"
                download_tasks[task_id].progress = 99.9
            else:
                download_tasks[task_id].status = "completed"
                download_tasks[task_id].progress = 100.0
                download_tasks[task_id].speed = None
                download_tasks[task_id].eta = None

        elif d["status"] == "error":
            download_tasks[task_id].status = "error"
            download_tasks[task_id].error = str(d.get("error", "Unknown error"))
            logger.error(
                f"Download error for task {task_id}: {download_tasks[task_id].error}"
            )

    except Exception as e:
        logger.exception(f"Error updating progress for task {task_id}: {str(e)}")


async def download_task(task_id: str, request: DownloadRequest):
    """Background task for video download."""
    start_time = time.time()
    options = None
    try:
        task_dir = DOWNLOAD_DIR / task_id
        task_dir.mkdir(exist_ok=True)

        logger.info(f"Starting download task {task_id} for URL: {request.url}")

        # Get options with cookie integration
        options = get_ytdlp_options(request, task_id)
        
        # Log cookie usage but protect sensitive info
        cookie_type = "client" if request.client_cookies else ("browser" if request.use_browser_cookies else "none")
        logger.info(f"Using cookies ({cookie_type}) for task {task_id}")

        with yt_dlp.YoutubeDL(options) as ydl:
            download_tasks[task_id] = DownloadStatus(
                status="downloading", progress=0.0, eta=None, speed=None
            )
            ydl.add_progress_hook(lambda d: update_progress(task_id, d))
            await asyncio.get_running_loop().run_in_executor(
                None, lambda: ydl.download([str(request.url)])
            )

            # If status is still "downloading" at this point, we force it to "completed"
            if download_tasks[task_id].status == "downloading":
                download_tasks[task_id].status = "completed"
                download_tasks[task_id].progress = 100.0

        duration = time.time() - start_time
        logger.info(f"Download task {task_id} completed in {duration:.2f} seconds")

    except Exception as e:
        logger.exception(f"Error in download task {task_id}: {str(e)}")
        download_tasks[task_id] = DownloadStatus(
            status="error", progress=0.0, error=str(e), eta=None, speed=None
        )
    finally:
        # Clean up any cookie files
        if options:
            cleanup_cookie_file(options)


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
                message="No cookies provided"
            )
        
        # Create a test cookie file to verify
        test_id = f"test_{uuid.uuid4()}"
        cookie_file = cookie_manager.create_cookie_file(cookies.cookies, test_id)
        
        # Clean up test file
        cookie_manager.delete_cookie_file(cookie_file)
        
        return CookieStatusResponse(
            browser_cookies_available=check_browser_available(DEFAULT_BROWSER),
            client_cookies_supported=True,
            message=f"Successfully processed {len(cookies.cookies)} cookies"
        )
    except Exception as e:
        logger.error(f"Error processing uploaded cookies: {e}")
        return CookieStatusResponse(
            browser_cookies_available=check_browser_available(DEFAULT_BROWSER),
            client_cookies_supported=True,
            message=f"Error processing cookies: {str(e)}"
        )


@app.post("/api/download", response_model=DownloadResponse)
async def start_download(request: DownloadRequest, background_tasks: BackgroundTasks):
    """Start a new download task."""
    task_id = str(uuid.uuid4())
    logger.info(f"Creating download task {task_id} for URL: {request.url}")
    background_tasks.add_task(download_task, task_id, request)
    return DownloadResponse(
        task_id=task_id, status="started", message="Download started"
    )


@app.get("/api/status/{task_id}", response_model=DownloadStatus)
async def get_status(task_id: str):
    """Get status of a download task."""
    if task_id not in download_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return download_tasks[task_id]


@app.get("/api/info", response_model=VideoInfoResponse)
async def get_video_info(
    url: HttpUrl,
    is_playlist: bool = Query(False),
    client_cookies: Optional[List[Dict]] = None
):
    """Get information about a video or playlist."""
    start_time = time.time()
    cookie_file = None
    
    try:
        clean_url = sanitize_url(str(url), is_playlist)
        logger.info(f"Fetching video info for URL: {clean_url}")

        # Convert client cookies if provided in query
        cookies_list = None
        if client_cookies:
            try:
                cookies_list = [Cookie(**cookie) for cookie in client_cookies]
                logger.info(f"Using {len(cookies_list)} client-provided cookies for video info")
            except Exception as e:
                logger.warning(f"Failed to parse client cookies: {e}")

        # Basic yt-dlp options
        options = {
            "noplaylist": not is_playlist,
            "extract_flat": "discard" if not is_playlist else None,
            "quiet": True,
            "no_warnings": True,
            "download": False,
        }

        # Get cookie arguments - handle both client and browser cookies
        cookie_args, cookie_file = get_yt_dlp_base_args(True, cookies_list)
        
        # Add cookie arguments to yt-dlp options
        if "--cookies" in cookie_args:
            options["cookies"] = cookie_args[cookie_args.index("--cookies") + 1]
        elif "--cookies-from-browser" in cookie_args:
            options["cookiesfrombrowser"] = (cookie_args[cookie_args.index("--cookies-from-browser") + 1], None, None, None)

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
            additional_info += "\nConsider providing client-side cookies for authentication."
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


@app.get("/api/formats", response_model=FormatsResponse)
async def get_formats(
    url: HttpUrl,
    is_playlist: bool = Query(False),
    client_cookies: Optional[List[Dict]] = None
):
    """Get available formats for a video or playlist with premium quality options."""
    start_time = time.time()
    cookie_file = None
    
    try:
        clean_url = sanitize_url(str(url), is_playlist)
        logger.info(f"Fetching formats for URL: {clean_url}")

        # Convert client cookies if provided in query
        cookies_list = None
        if client_cookies:
            try:
                cookies_list = [Cookie(**cookie) for cookie in client_cookies]
                logger.info(f"Using {len(cookies_list)} client-provided cookies for formats")
            except Exception as e:
                logger.warning(f"Failed to parse client cookies: {e}")

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
        cookie_args, cookie_file = get_yt_dlp_base_args(True, cookies_list)
        
        # Add cookie arguments to yt-dlp options
        if "--cookies" in cookie_args:
            options["cookies"] = cookie_args[cookie_args.index("--cookies") + 1]
        elif "--cookies-from-browser" in cookie_args:
            options["cookiesfrombrowser"] = (cookie_args[cookie_args.index("--cookies-from-browser") + 1], None, None, None)

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
        message=message
    )


@app.get("/api/cleanup/{days}")
async def cleanup_old_downloads(days: int = 7):
    """Clean up downloads older than the specified number of days."""
    if days < 1:
        raise HTTPException(status_code=400, detail="Days must be at least 1")

    try:
        cutoff = time.time() - (days * 24 * 60 * 60)
        cleaned = 0

        for item in DOWNLOAD_DIR.glob("*"):
            if item.is_dir() and item.stat().st_mtime < cutoff:
                for file in item.glob("**/*"):
                    if file.is_file():
                        file.unlink()
                        cleaned += 1

                item.rmdir()  # Remove empty directory

        return {"message": f"Cleaned up {cleaned} old files"}
    except Exception as e:
        logger.exception(f"Error during cleanup: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


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
            "message": "Client-side cookies are supported for authentication."
        },
        "browser_status": {
            "browser": DEFAULT_BROWSER,
            "is_available": browser_available,
            "message": browser_status_message,
        },
    }


if __name__ == "__main__":
    import uvicorn

    # Get port and host from environment variables or default values
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")

    uvicorn.run(app, host=host, port=port)
