import React, { useEffect, useState, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Download, List, Clipboard, X, Youtube, ArrowRight } from 'lucide-react'
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
        className="space-y-7 py-2"
      >
        <div className="space-y-5">
          <div className="dark:border-b border-primary/10 pb-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="url-input" className="text-lg font-medium flex items-center gap-2">
                <Youtube className="h-5 w-5 dark:text-primary text-secondary-foreground" />
                Enter video URL
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePaste}
                type="button"
                className={`h-8 relative overflow-hidden dark:border-primary/30 border-secondary/30 
                dark:text-primary-foreground text-secondary-foreground 
                dark:hover:bg-primary/20 hover:bg-secondary/20
                rounded-full px-3 ${pasteAnimation ? 'dark:border-success border-success dark:text-success text-success' : ''}`}
              >
                <Clipboard className="h-3.5 w-3.5 mr-1.5" /> 
                {pasteAnimation ? 'Pasted!' : 'Paste'}
              </Button>
            </div>
            <p className="text-sm dark:text-primary-foreground/70 text-secondary-foreground/70 mt-1">
              Enter a URL from YouTube, TikTok, Twitter, or any other supported service
            </p>
          </div>
          
          <div className="relative">
            <Input
              id="url-input"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={handleInputChange}
              onFocus={() => setUrlFocused(true)}
              onBlur={() => setUrlFocused(false)}
              className={`h-12 pl-5 pr-12 text-base dark:border-primary/30 border-secondary/30 
                dark:bg-background/60 bg-white/80 dark:focus:border-primary focus:border-secondary
                dark:text-white text-foreground dark:placeholder:text-primary-foreground/40 placeholder:text-secondary-foreground/50
                rounded-xl shadow-sm ${urlFocused ? 'dark:ring-2 dark:ring-primary/20 ring-2 ring-secondary/20' : ''}`}
            />
            
            {url && (
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setUrl('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-full 
                dark:hover:bg-primary/20 hover:bg-secondary/20 dark:text-primary-foreground text-secondary-foreground"
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2 px-5 py-4 dark:bg-primary/5 bg-secondary/10 
            rounded-xl dark:border border-primary/20 border-secondary/20">
            <Switch
              id="playlist-mode"
              checked={isPlaylist}
              onCheckedChange={setIsPlaylist}
              className="data-[state=checked]:dark:bg-primary data-[state=checked]:bg-secondary"
            />
            <div className="ml-2">
              <Label htmlFor="playlist-mode" className="flex items-center gap-1.5 cursor-pointer">
                <List className="h-4 w-4 dark:text-primary text-secondary-foreground" />
                <span>This is a playlist</span>
              </Label>
              <p className="text-xs dark:text-primary-foreground/70 text-secondary-foreground/70 mt-1">
                Download all videos in the playlist
              </p>
            </div>
            
            {isPlaylist && (
              <span className="ml-auto text-xs dark:bg-primary/20 bg-secondary/20 px-2.5 py-1 rounded-full 
                dark:border border-primary/30 border-secondary/30 dark:text-primary-foreground text-secondary-foreground">
                Playlist mode
              </span>
            )}
          </div>
        </div>
        
        <div className="pt-1">
          <Button 
            onClick={fetchVideoInfo}
            disabled={!url || loading}
            size="lg"
            className="w-full py-6 text-base flex items-center justify-center dark:bg-gradient-to-r dark:from-primary dark:to-accent/80 
              bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all duration-300 
              dark:shadow-lg dark:shadow-primary/20 shadow-lg shadow-secondary/20 rounded-xl"
          >
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span>Fetching video information...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <Download className="mr-2 h-5 w-5" />
                <span className="font-medium">Get Video Information</span>
                <ArrowRight className="h-4 w-4 ml-2 animate-pulse" />
              </div>
            )}
          </Button>
          
          <div className="mt-5 flex items-center justify-center">
            <p className="text-xs dark:text-primary-foreground/60 text-secondary-foreground/60 text-center">
              Supports YouTube, TikTok, Twitter, Instagram, Soundcloud, and many more services
            </p>
          </div>
        </div>
      </motion.div>
    )
  }
)
UrlTab.displayName = 'UrlTab'