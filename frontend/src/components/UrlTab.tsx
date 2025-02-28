import React, { useEffect, useState, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Download, List, Clipboard, Link2, X } from 'lucide-react'
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
    const [urlFocused, setUrlFocused] = useState(false)
    const [pasteAnimation, setPasteAnimation] = useState(false)

    useEffect(() => {
      try {
        const urlObj = new URL(url)
        const params = new URLSearchParams(urlObj.search)
        setIsPlaylist(params.has('list'))
      } catch {
        setIsPlaylist(false)
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
        
        // Show paste animation
        setPasteAnimation(true)
        setTimeout(() => setPasteAnimation(false), 1000)
        
        // Detect if it might be a playlist based on URL format
        if (text.includes('list=') || text.includes('playlist')) {
          setIsPlaylist(true)
        }
      } catch (err) {
        console.error("Failed to read clipboard:", err)
      }
    }

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="url-input" className="text-lg font-medium flex items-center gap-2 text-white">
              <Link2 className="h-5 w-5 text-violet-400" />
              Enter video URL
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePaste}
              type="button"
              className={`h-8 relative overflow-hidden border-violet-500/30 text-violet-300 hover:bg-violet-500/20 hover:text-white hover:border-violet-500/60 rounded-full px-3 ${pasteAnimation ? 'border-green-500/60 text-green-300' : ''}`}
            >
              <Clipboard className="h-3.5 w-3.5 mr-1.5" /> 
              {pasteAnimation ? 'Pasted!' : 'Paste'}
            </Button>
          </div>
          
          <div className="relative group">
            <Input
              id="url-input"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={handleInputChange}
              onFocus={() => setUrlFocused(true)}
              onBlur={() => setUrlFocused(false)}
              className={`h-12 px-4 text-base border-violet-500/30 bg-violet-900/20 focus:border-violet-500 text-white placeholder:text-violet-400/60 rounded-lg shadow-sm ${urlFocused ? 'border-violet-500 ring-1 ring-violet-500/50' : ''}`}
            />
            
            {url && (
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setUrl('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-full hover:bg-violet-900/50 text-violet-300"
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2 px-4 py-3 bg-violet-900/20 rounded-lg border border-violet-500/20">
            <Switch
              id="playlist-mode"
              checked={isPlaylist}
              onCheckedChange={setIsPlaylist}
              className="data-[state=checked]:bg-violet-500"
            />
            <Label htmlFor="playlist-mode" className="flex items-center gap-1.5 cursor-pointer text-violet-200">
              <List className="h-4 w-4 text-violet-400" />
              <span>This is a playlist</span>
            </Label>
            
            {isPlaylist && (
              <span className="ml-auto text-xs bg-violet-500/20 px-2 py-1 rounded-full border border-violet-500/30 text-violet-300">
                Download all videos
              </span>
            )}
          </div>
        </div>
        
        <Button 
          onClick={fetchVideoInfo}
          disabled={!url || loading}
          size="lg"
          className="w-full h-11 text-base bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 shadow-md shadow-violet-900/30 rounded-lg font-medium"
        >
          {loading ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span>Fetching video information...</span>
            </div>
          ) : (
            <div className="flex items-center">
              <Download className="mr-2 h-5 w-5" />
              <span>Get Video Information</span>
            </div>
          )}
        </Button>
      </motion.div>
    )
  }
)
UrlTab.displayName = 'UrlTab'