from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Dict
import yt_dlp
import asyncio
import uuid
from pathlib import Path
from urllib.parse import urlparse, parse_qs, urlunparse, urlencode

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class DownloadRequest(BaseModel):
    url: HttpUrl
    format: Optional[str] = "best"
    extract_audio: bool = False
    audio_format: Optional[str] = None
    quality: Optional[str] = None
    embed_metadata: bool = True
    embed_thumbnail: bool = False
    download_subtitles: bool = False
    subtitle_languages: Optional[List[str]] = None
    download_playlist: bool = False
    sponsorblock: bool = False


class DownloadResponse(BaseModel):
    task_id: str
    status: str
    message: str


class DownloadStatus(BaseModel):
    status: str
    progress: float
    filename: Optional[str] = None
    error: Optional[str] = None


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


download_tasks: Dict[str, DownloadStatus] = {}
DOWNLOAD_DIR = Path("downloads")
DOWNLOAD_DIR.mkdir(exist_ok=True)


def sanitize_url(url: str, is_playlist: bool) -> str:
    parsed = urlparse(url)
    query = parse_qs(parsed.query)
    for param in ["feature", "ab_channel", "si", "pp"]:
        query.pop(param, None)
    if not is_playlist:
        query.pop("list", None)
    return urlunparse(parsed._replace(query=urlencode(query, doseq=True)))


def get_ytdlp_options(request: DownloadRequest, task_id: str) -> dict:
    chosen_format = request.format
    if request.extract_audio and (chosen_format == "best" or chosen_format == ""):
        chosen_format = "bestaudio"

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
        "X-YouTube-Client-Version": "2.20210721.00.00",
    }

    options = {
        "format": chosen_format,
        "outtmpl": str(DOWNLOAD_DIR / f"{task_id}/%(title)s.%(ext)s"),
        "writethumbnail": request.embed_thumbnail,
        "embedmetadata": request.embed_metadata,
        "noplaylist": not request.download_playlist,
        "extract_flat": "discard" if not request.download_playlist else None,
        "writesubtitles": request.download_subtitles,
        "subtitleslangs": (
            ",".join(request.subtitle_languages) if request.subtitle_languages else None
        ),
        "postprocessors": [],
        "sponsorblock": "all" if request.sponsorblock else None,
        "quiet": False,
        "no_warnings": False,
        "verbose": True,
        "http_headers": default_headers,
        "hls_use_mpegts": True,
        "extractor_args": {"youtube": {"formats": "missing_pot"}},
        # Uncomment the next line if you have a valid cookies file
        # "cookiefile": "path/to/your/cookie.txt",
    }

    if request.extract_audio:
        options["postprocessors"].append(
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": request.audio_format,
                "preferredquality": request.quality,
            }
        )

    return options


def update_progress(task_id: str, d: dict):
    if d["status"] == "downloading":
        if d.get("_type") == "playlist":
            download_tasks[task_id].filename = (
                f"Playlist: {d.get('info_dict', {}).get('title')}"
            )
            try:
                progress = (
                    d.get("playlist_index", 0) / d.get("playlist_count", 1)
                ) * 100
            except:
                progress = 0.0
        else:
            try:
                progress = float(d["downloaded_bytes"]) / float(d["total_bytes"]) * 100
            except:
                progress = 0.0
            download_tasks[task_id].filename = d.get("filename")
        download_tasks[task_id].progress = progress
    elif d["status"] == "finished":
        download_tasks[task_id].status = "completed"
        download_tasks[task_id].progress = 100.0
    elif d["status"] == "error":
        download_tasks[task_id].status = "error"
        download_tasks[task_id].error = str(d.get("error"))


async def download_task(task_id: str, request: DownloadRequest):
    try:
        task_dir = DOWNLOAD_DIR / task_id
        task_dir.mkdir(exist_ok=True)
        with yt_dlp.YoutubeDL(get_ytdlp_options(request, task_id)) as ydl:
            download_tasks[task_id] = DownloadStatus(status="downloading", progress=0.0)
            ydl.add_progress_hook(lambda d: update_progress(task_id, d))
            await asyncio.get_running_loop().run_in_executor(
                None, lambda: ydl.download([str(request.url)])
            )
    except Exception as e:
        download_tasks[task_id] = DownloadStatus(
            status="error", progress=0.0, error=str(e)
        )


@app.post("/api/download", response_model=DownloadResponse)
async def start_download(request: DownloadRequest, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    background_tasks.add_task(download_task, task_id, request)
    return DownloadResponse(
        task_id=task_id, status="started", message="Download started"
    )


@app.get("/api/status/{task_id}", response_model=DownloadStatus)
async def get_status(task_id: str):
    if task_id not in download_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return download_tasks[task_id]


@app.get("/api/info", response_model=VideoInfoResponse)
async def get_video_info(url: HttpUrl, is_playlist: bool = Query(False)):
    try:
        clean_url = sanitize_url(str(url), is_playlist)
        with yt_dlp.YoutubeDL(
            {
                "noplaylist": not is_playlist,
                "extract_flat": "discard" if not is_playlist else None,
                "quiet": True,
                "download": False,
            }
        ) as ydl:
            info = await asyncio.get_running_loop().run_in_executor(
                None, lambda: ydl.extract_info(clean_url, download=False)
            )
            return VideoInfoResponse(
                title=info.get("title", ""),
                duration=info.get("duration"),
                thumbnail=info.get("thumbnail"),
                description=info.get("description"),
                uploader=info.get("uploader"),
                view_count=info.get("view_count"),
                upload_date=info.get("upload_date"),
                is_playlist="entries" in info,
                entries=info.get("entries", [])[:50] if "entries" in info else None,
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/formats", response_model=FormatsResponse)
async def get_formats(url: HttpUrl, is_playlist: bool = Query(False)):
    try:
        clean_url = sanitize_url(str(url), is_playlist)
        with yt_dlp.YoutubeDL(
            {
                "noplaylist": not is_playlist,
                "extract_flat": "discard" if not is_playlist else None,
                "quiet": True,
                "download": False,
            }
        ) as ydl:
            info = await asyncio.get_running_loop().run_in_executor(
                None, lambda: ydl.extract_info(clean_url, download=False)
            )
            return FormatsResponse(
                is_playlist="entries" in info,
                formats=info.get("formats", []),
                entries=info.get("entries", [])[:50] if "entries" in info else None,
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
