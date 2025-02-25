import React, { useEffect, useState, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Download, Youtube, List, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'

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
    const [urlFocused, setUrlFocused] = useState(false)

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
      const value = e.target.value
      setUrl(value)
      
      // Detect if it might be a playlist based on URL format
      if (value.includes('list=') || value.includes('playlist')) {
        setIsPlaylist(true)
      }
    }

    const handlePaste = async () => {
      try {
        const text = await navigator.clipboard.readText()
        setUrl(text)
        
        // Detect if it might be a playlist based on URL format
        if (text.includes('list=') || text.includes('playlist')) {
          setIsPlaylist(true)
        }
      } catch (err) {
        console.error("Failed to read clipboard:", err)
      }
    }

    const popularServices = [
      { name: "YouTube", icon: <Youtube className="h-4 w-4 text-red-500" /> },
      { name: "Vimeo", icon: <ExternalLink className="h-4 w-4 text-blue-500" /> },
      { name: "TikTok", icon: <ExternalLink className="h-4 w-4 text-pink-500" /> },
      { name: "Twitter", icon: <ExternalLink className="h-4 w-4 text-sky-500" /> }
    ]

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="url-input" className="text-lg font-medium">
              Enter video or playlist URL
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePaste}
              type="button"
              className="h-8 text-xs"
            >
              Paste from clipboard
            </Button>
          </div>
          
          <div className={`relative group ${urlFocused ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-md' : ''}`}>
            <Input
              id="url-input"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={handleInputChange}
              onFocus={() => setUrlFocused(true)}
              onBlur={() => setUrlFocused(false)}
              className={`h-12 pl-4 pr-28 text-base transition-all duration-200 ${url ? 'border-primary' : ''}`}
            />
            
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => setUrl('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
              type="button"
              disabled={!url}
            >
              Clear
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="playlist-mode"
              checked={isPlaylist}
              onCheckedChange={setIsPlaylist}
            />
            <Label htmlFor="playlist-mode" className="flex items-center gap-1.5 cursor-pointer">
              <List className="h-4 w-4" />
              <span>This is a playlist</span>
            </Label>
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          <Button 
            onClick={fetchVideoInfo}
            disabled={!url || loading}
            size="lg"
            className="w-full h-12 text-base"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Fetching information...
              </>
            ) : (
              <>
                <Download className="mr-2 h-5 w-5" />
                Get video information
              </>
            )}
          </Button>
          
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-4">
              <p className="text-center text-sm text-muted-foreground">
                Supported platforms include:
              </p>
              <div className="flex justify-center mt-2 flex-wrap gap-2">
                {popularServices.map((service) => (
                  <span 
                    key={service.name} 
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-background border"
                  >
                    {service.icon}
                    {service.name}
                  </span>
                ))}
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-background border">
                  + hundreds more
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    )
  }
)
UrlTab.displayName = 'UrlTab'
