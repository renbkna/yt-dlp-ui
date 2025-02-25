import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge Tailwind CSS classes without style conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format file size from bytes to human-readable format
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return "Unknown"
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Format duration from seconds to HH:MM:SS
 */
export function formatDuration(seconds?: number): string {
  if (!seconds) return "Unknown"
  
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format date from YYYYMMDD to a readable format
 */
export function formatDate(date?: string): string {
  if (!date || date.length !== 8) return "Unknown date"
  
  const year = date.substring(0, 4)
  const month = date.substring(4, 6)
  const day = date.substring(6, 8)
  
  return new Date(`${year}-${month}-${day}`).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Format view count with commas
 */
export function formatViews(views?: number): string {
  if (!views) return "Unknown views"
  return new Intl.NumberFormat().format(views)
}

/**
 * Ensure a URL is valid
 */
export function validateURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Detect if a URL is likely a playlist
 */
export function isPlaylistURL(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const params = new URLSearchParams(urlObj.search)
    return params.has('list') || url.includes('playlist')
  } catch {
    return false
  }
}
