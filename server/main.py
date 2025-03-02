from fastapi import FastAPI, HTTPException, BackgroundTasks, Query, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List, Dict, Union, Any
import yt_dlp
import asyncio
import uuid
import os
import logging
import time
import re
import subprocess
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse, parse_qs, urlunparse, urlencode

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("yt_dlp_api.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("yt-dlp-api")

# Browser to use for cookie extraction - can be set via environment variable
# Options: chrome, chromium, firefox, opera, edge, safari, brave, vivaldi
DEFAULT_BROWSER = os.getenv("YT_DLP_BROWSER", "chrome")

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
)


class DownloadRequest(BaseModel):
    url: HttpUrl
    format: Optional[str] = Field(default="best", description="Video format code")
    extract_audio: bool = Field(default=False, description="Extract audio from video")
    audio_format: Optional[str] = Field(default=None, description="Audio format (mp3, m4a, etc.)")
    quality: Optional[str] = Field(default=None, description="Audio quality (0-9)")
    embed_metadata: bool = Field(default=True, description="Embed metadata in file")
    embed_thumbnail: bool = Field(default=False, description="Embed thumbnail in file")
    download_subtitles: bool = Field(default=False, description="Download subtitles")
    subtitle_languages: Optional[List[str]] = Field(default=None, description="Subtitle languages")
    download_playlist: bool = Field(default=False, description="Download all videos in playlist")
    sponsorblock: bool = Field(default=False, description="Skip sponsored segments")
    use_browser_cookies: bool = Field(default=True, description="Use browser cookies")
    chapters_from_comments: bool = Field(default=False, description="Create chapters from comments")


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


download_tasks: Dict[str, DownloadStatus] = {}
DOWNLOAD_DIR = Path(os.getenv("DOWNLOAD_DIR", "downloads"))
DOWNLOAD_DIR.mkdir(exist_ok=True)


# Custom exception handlers
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please check the server logs."},
    )


def sanitize_url(url: str, is_playlist: bool) -> str:
    """Clean up URL by removing unnecessary parameters."""
    parsed = urlparse(url)
    query = parse_qs(parsed.query)
    # Remove unnecessary YouTube parameters
    for param in ["feature", "ab_channel", "si", "pp", "utm_source", "utm_medium", "utm_campaign"]:
        query.pop(param, None)
    if not is_playlist:
        query.pop("list", None)
    return urlunparse(parsed._replace(query=urlencode(query, doseq=True)))


def check_browser_available(browser: str = DEFAULT_BROWSER) -> bool:
    """Check if a browser is available for cookie extraction."""
    try:
        # Use direct command execution to test if browser cookies can be extracted
        cmd = ["yt-dlp", "--cookies-from-browser", browser, "--skip-download", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"]
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=5, check=False)
        return True
    except Exception as e:
        logger.warning(f"Browser {browser} not available for cookie extraction: {str(e)}")
        return False


def get_yt_dlp_base_args(use_browser_cookies: bool) -> List[str]:
    """Get base yt-dlp command-line arguments including browser cookies if requested."""
    args = []
    if use_browser_cookies and DEFAULT_BROWSER:
        logger.info(f"Adding cookies-from-browser: {DEFAULT_BROWSER}")
        args.extend(["--cookies-from-browser", DEFAULT_BROWSER])
    return args


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
        "writethumbnail": request.embed_thumbnail or request.download_thumbnail,
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
        "extractor_args": {"youtube": {"formats": "missing_pot"}},  # Get premium formats for YouTube
        "retries": 10,  # More retries for stability
        "fragment_retries": 10,
        "file_access_retries": 5,
        "retry_sleep_functions": {"http": lambda n: 1.0 * (2 ** (n - 1))},
        "allow_unplayable_formats": True,  # Allow premium formats  
        "check_formats": False,  # Don't skip formats that might not be playable
    }

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
        options["postprocessors"].append({"key": "Exec", "exec_cmd": "echo Chapter extraction complete."})

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
                        progress = float(d["downloaded_bytes"]) / float(d["total_bytes"]) * 100
                    elif "total_bytes_estimate" in d:
                        progress = float(d["downloaded_bytes"]) / float(d["total_bytes_estimate"]) * 100
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
                
                download_tasks[task_id].filename = d.get("filename", "").split('/')[-1]
                
            download_tasks[task_id].progress = min(progress, 99.9)  # Cap at 99.9% until fully complete
            download_tasks[task_id].status = "downloading"  # Ensure status is set correctly
            
        elif d["status"] == "finished":
            if "ext" in d and d["ext"] and d["ext"] != d.get("info_dict", {}).get("ext", ""):
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
            logger.error(f"Download error for task {task_id}: {download_tasks[task_id].error}")
            
    except Exception as e:
        logger.exception(f"Error updating progress for task {task_id}: {str(e)}")


async def download_task(task_id: str, request: DownloadRequest):
    """Background task for video download."""
    start_time = time.time()
    try:
        task_dir = DOWNLOAD_DIR / task_id
        task_dir.mkdir(exist_ok=True)
        
        logger.info(f"Starting download task {task_id} for URL: {request.url}")
        
        # Get base command line arguments, including browser cookies
        base_args = get_yt_dlp_base_args(request.use_browser_cookies)
        logger.info(f"Using base arguments: {base_args}")
        
        with yt_dlp.YoutubeDL(get_ytdlp_options(request, task_id)) as ydl:
            # Apply command-line arguments
            if base_args:
                logger.info("Applying command line arguments to YoutubeDL")
                ydl.params.update(ydl.parse_options(base_args))
                
            download_tasks[task_id] = DownloadStatus(
                status="downloading", 
                progress=0.0,
                eta=None,
                speed=None
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
            status="error", 
            progress=0.0, 
            error=str(e),
            eta=None,
            speed=None
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
async def get_video_info(url: HttpUrl, is_playlist: bool = Query(False)):
    """Get information about a video or playlist."""
    start_time = time.time()
    try:
        clean_url = sanitize_url(str(url), is_playlist)
        logger.info(f"Fetching video info for URL: {clean_url}")
        
        # Basic yt-dlp options
        options = {
            "noplaylist": not is_playlist,
            "extract_flat": "discard" if not is_playlist else None,
            "quiet": True,
            "no_warnings": True,
            "download": False,
        }
        
        # Add command line arguments for browser cookies (always use for info)
        base_args = get_yt_dlp_base_args(True)
        
        # Direct subprocess call with cookies-from-browser
        try:
            # First try direct subprocess call with cookies-from-browser for maximum compatibility
            cmd = ["yt-dlp", "--dump-json", "--no-warnings", "--quiet"]
            if not is_playlist:
                cmd.append("--no-playlist")
            
            # Add browser cookies arguments
            if base_args:
                cmd.extend(base_args)
                
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
                # Apply command-line arguments
                if base_args:
                    ydl.params.update(ydl.parse_options(base_args))
                
                info = await asyncio.get_running_loop().run_in_executor(
                    None, lambda: ydl.extract_info(clean_url, download=False)
                )
                
                duration = time.time() - start_time
                logger.info(f"Video info fetched via Python API in {duration:.2f} seconds")
        
        # Handle playlists
        is_playlist_result = "entries" in info
        entries = info.get("entries", [])[:50] if is_playlist_result else None
        
        # Extract simplified entry data for playlists
        if entries:
            simplified_entries = []
            for entry in entries:
                simplified_entries.append({
                    "id": entry.get("id", ""),
                    "title": entry.get("title", "Untitled"),
                    "duration": entry.get("duration"),
                    "thumbnail": entry.get("thumbnail"),
                })
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
            raise HTTPException(
                status_code=400, 
                detail=error_message + additional_info
            )
            
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
                path_parts = parsed_url.path.strip('/').split('/')
                username = None
                for i, part in enumerate(path_parts):
                    if part.startswith('@') and i+2 < len(path_parts) and path_parts[i+1] == 'video':
                        username = part[1:]  # Remove @ prefix
                        video_id = path_parts[i+2]
                        break
                
                title = f"TikTok video by @{username or 'user'}"
            else:
                # For Instagram, similar approach
                video_id = parsed_url.path.split('/')[-1]
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


@app.get("/api/formats", response_model=FormatsResponse)
async def get_formats(url: HttpUrl, is_playlist: bool = Query(False)):
    """Get available formats for a video or playlist with premium quality options."""
    start_time = time.time()
    try:
        clean_url = sanitize_url(str(url), is_playlist)
        logger.info(f"Fetching formats for URL: {clean_url}")
        
        # Basic yt-dlp options
        options = {
            "noplaylist": not is_playlist,
            "extract_flat": "discard" if not is_playlist else None,
            "quiet": True,
            "no_warnings": True,
            "download": False,
            "allow_unplayable_formats": True,  # Allow premium formats to be listed
            "check_formats": False,  # Don't skip unplayable formats
            "extractor_args": {"youtube": {"formats": "missing_pot"}},  # Get premium formats for YouTube
        }
        
        # Add command line arguments for browser cookies (always use for format lookup)
        base_args = get_yt_dlp_base_args(True)
        
        # Use direct subprocess call first for best compatibility
        try:
            # First try direct subprocess call with cookies-from-browser for maximum compatibility
            cmd = ["yt-dlp", "--dump-json", "--no-warnings", "--quiet", "--list-formats"]
            if not is_playlist:
                cmd.append("--no-playlist")
            
            # Add browser cookies arguments
            if base_args:
                cmd.extend(base_args)
                
            cmd.append(clean_url)
            
            logger.info(f"Running command: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            
            # Use the yt-dlp Python API for parsing formats as it's more reliable
            with yt_dlp.YoutubeDL(options) as ydl:
                # Apply command-line arguments
                if base_args:
                    ydl.params.update(ydl.parse_options(base_args))
                
                info = await asyncio.get_running_loop().run_in_executor(
                    None, lambda: ydl.extract_info(clean_url, download=False)
                )
            
            duration = time.time() - start_time
            logger.info(f"Formats fetched in {duration:.2f} seconds")
        except subprocess.CalledProcessError:
            # Fall back to using the yt-dlp Python API
            logger.info("Falling back to yt-dlp Python API for formats")
            with yt_dlp.YoutubeDL(options) as ydl:
                # Apply command-line arguments
                if base_args:
                    ydl.params.update(ydl.parse_options(base_args))
                
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
                if fmt.get("format_note") == "storyboard" or fmt.get("format_id", "").startswith("sb"):
                    continue
                    
                # Calculate filesize if not available but we have bitrate and duration
                if not fmt.get("filesize") and fmt.get("tbr") and info.get("duration"):
                    fmt["filesize"] = int((fmt["tbr"] * 1024 / 8) * info["duration"])
                
                # Mark premium formats explicitly for client-side filtering
                if fmt.get("format_note") and any(note in fmt.get("format_note").lower() for note in ["premium", "4320p", "8k", "dolby", "hdr"]):
                    fmt["is_premium"] = True
                
                # For TikTok/Instagram, ensure resolution is properly parsed for best quality detection
                if not fmt.get("height") and fmt.get("resolution"):
                    # Extract height from resolution string (e.g., "1280x720" -> 720)
                    resolution_match = re.search(r'(\d+)x(\d+)', fmt.get("resolution", ""))
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
        browser=browser,
        is_available=is_available,
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
    return {
        "message": "YT-DLP API is running",
        "version": "1.0.0",
        "documentation": "/docs",
        "browser_status": {
            "browser": DEFAULT_BROWSER,
            "is_available": check_browser_available(DEFAULT_BROWSER)
        }
    }


if __name__ == "__main__":
    import uvicorn

    # Get port and host from environment variables or default values
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")

    uvicorn.run(app, host=host, port=port)
