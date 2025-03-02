export interface DownloadOptions {
  format: string
  extractAudio: boolean
  audioFormat: string
  audioQuality: string
  embedMetadata: boolean
  embedThumbnail: boolean
  downloadThumbnail: boolean
  downloadSubtitles: boolean
  subtitleLanguages: string[]
  quality: string
  cookies: boolean;
  writeDescription: boolean
  writeComments: boolean
  writeThumbnail: boolean
  writeInfoJson: boolean
  sponsorblock: boolean
  chaptersFromComments: boolean
}

export interface VideoFormat {
  format_id: string
  ext: string
  resolution?: string
  filesize?: number
  vcodec?: string
  acodec?: string
  format_note?: string
  is_premium?: boolean
  height?: number
  width?: number
  tbr?: number
}

export interface VideoInfo {
  title: string
  duration?: number
  thumbnail?: string
  description?: string
  uploader?: string
  view_count?: number
  upload_date?: string
  is_playlist: boolean
  entries?: Array<{
    id: string
    title: string
    url: string
    duration?: number
    thumbnail?: string
  }>
}

export interface DownloadStatus {
  status: string
  progress: number
  filename?: string
  error?: string
  speed?: string
  eta?: number
}

// Use environment variable for API_BASE if available, or fallback to localhost
export const API_BASE = import.meta.env.VITE_API_URL ? 
  `${import.meta.env.VITE_API_URL}/api` : 
  'http://localhost:8000/api';