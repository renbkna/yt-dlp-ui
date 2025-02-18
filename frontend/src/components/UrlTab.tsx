import React, { useEffect, useState, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Download } from 'lucide-react'

export interface UrlTabProps {
  url: string
  setUrl: (url: string) => void
  loading: boolean
  fetchVideoInfo: () => Promise<void>
  isPlaylist: boolean
  setIsPlaylist: (value: boolean) => void
}

export const UrlTab: React.FC<UrlTabProps> = React.memo(
  ({ url, setUrl, loading, fetchVideoInfo, isPlaylist, setIsPlaylist }) => {
    const [urlError, setUrlError] = useState<string>('')

    useEffect(() => {
      try {
        const urlObj = new URL(url)
        const params = new URLSearchParams(urlObj.search)
        setIsPlaylist(params.has('list'))
        setUrlError('')
      } catch {
        setIsPlaylist(false)
        if (url.length > 0) {
          setUrlError('Invalid URL')
        } else {
          setUrlError('')
        }
      }
    }, [url, setIsPlaylist])

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
      setUrl(e.target.value)
    }

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="url">Video URL</Label>
          <div className="flex space-x-2">
            <Input
              id="url"
              placeholder="Enter YouTube URL"
              value={url}
              onChange={handleInputChange}
              aria-invalid={!!urlError}
            />
            <Button
              onClick={fetchVideoInfo}
              disabled={loading || !url || !!urlError}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Fetching...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Fetch
                </>
              )}
            </Button>
          </div>
          {urlError && <p className="text-sm text-red-600">{urlError}</p>}
          <div className="flex items-center space-x-2 pt-2">
            <Switch id="playlist-mode" checked={isPlaylist} onCheckedChange={setIsPlaylist} />
            <Label htmlFor="playlist-mode" className="text-sm">
              Handle as playlist
            </Label>
          </div>
        </div>
      </div>
    )
  }
)
UrlTab.displayName = 'UrlTab'
