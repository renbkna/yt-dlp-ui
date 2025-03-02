export interface ClientCookie {
  domain: string;
  name: string;
  value: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  expirationDate?: number;
}

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
  useBrowserCookies: boolean
  clientCookies?: ClientCookie[] // New field for client-side cookies
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

export interface CookieStatus {
  browser_cookies_available: boolean;
  client_cookies_supported: boolean;
  cookie_file_path?: string;
  message: string;
}

// Use environment variable for API_BASE, ensuring it has the correct format
const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    const baseUrl = import.meta.env.VITE_API_URL.toString();
    // Remove trailing slash if present
    const normalizedUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${normalizedUrl}/api`;
  }
  return 'http://localhost:8000/api';
};

export const API_BASE = getApiBase();