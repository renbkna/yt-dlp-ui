import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, Settings, Download, AlertCircle, Youtube, List, Share2, Music, Film, Sparkles } from "lucide-react"
import type { DownloadOptions, VideoInfo, VideoFormat, DownloadStatus } from "@/types"
import { useToast } from "@/components/ui/use-toast"
import { AnimatePresence, motion } from "framer-motion"
import { UrlTab } from "@/components/UrlTab"
import { VideoInfoHeader } from "@/components/VideoInfoHeader"
import { AudioOptions } from "@/components/AudioOptions"
import { VideoFormatSelector } from "@/components/VideoFormatSelector"
import { MetadataOptions } from "@/components/MetadataOptions"
import { AdditionalFeatures } from "@/components/AdditionalFeatures"
import { SubtitleOptions } from "@/components/SubtitleOptions"
import { ProgressTab } from "@/components/ProgressTab"
import { API_BASE } from "@/types"

const YTDLPPage = () => {
  const { toast } = useToast()
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [formats, setFormats] = useState<VideoFormat[]>([])
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus | null>(null)
  const [activeTab, setActiveTab] = useState("download")
  const [error, setError] = useState<string | null>(null)
  const [isPlaylist, setIsPlaylist] = useState(false)

  const [downloadOptions, setDownloadOptions] = useState<DownloadOptions>({
    format: "",
    extractAudio: false,
    audioFormat: "mp3",
    audioQuality: "0",
    embedMetadata: true,
    embedThumbnail: true,
    downloadThumbnail: false,
    downloadSubtitles: false,
    subtitleLanguages: ["en"],
    quality: "best",
    writeDescription: false,
    writeComments: false,
    writeThumbnail: false,
    writeInfoJson: false,
    cookies: true,
    sponsorblock: false,
    chaptersFromComments: false,
  })

  const updateDownloadOption = (key: keyof DownloadOptions, value: string | boolean | unknown) => {
    setDownloadOptions((prev) => ({ ...prev, [key]: value }))
  }

  const fetchVideoInfo = async () => {
    if (!url) {
      toast({
        title: "URL Required",
        description: "Please enter a valid video or playlist URL.",
        variant: "destructive",
      })
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const [infoResponse, formatsResponse] = await Promise.all([
        fetch(`${API_BASE}/info?url=${encodeURIComponent(url)}&is_playlist=${isPlaylist}`),
        fetch(`${API_BASE}/formats?url=${encodeURIComponent(url)}&is_playlist=${isPlaylist}`),
      ])
      
      if (!infoResponse.ok || !formatsResponse.ok) {
        throw new Error("Failed to fetch video info")
      }

      const info = await infoResponse.json()
      const formatsData = await formatsResponse.json()

      if (formatsData.is_playlist) {
        setVideoInfo({ ...info, is_playlist: true })
        setFormats([])
        toast({
          title: "Playlist Detected",
          description: `Found ${info.entries?.length || 0} videos in playlist.`,
          variant: "default",
        })
      } else {
        setVideoInfo({ ...info, is_playlist: false })
        setFormats(formatsData.formats || [])
        toast({
          title: "Video Info Retrieved",
          description: "Successfully loaded video information.",
          variant: "default",
        })
      }

      setActiveTab("options")
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "An error occurred"
      setError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const startDownload = async () => {
    try {
      setError(null)
      const response = await fetch(`${API_BASE}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          format: downloadOptions.format,
          extract_audio: downloadOptions.extractAudio,
          audio_format: downloadOptions.audioFormat,
          quality: downloadOptions.audioQuality,
          embed_metadata: downloadOptions.embedMetadata,
          embed_thumbnail: downloadOptions.embedThumbnail,
          download_subtitles: downloadOptions.downloadSubtitles,
          subtitle_languages: downloadOptions.subtitleLanguages,
          download_playlist: isPlaylist,
          sponsorblock: downloadOptions.sponsorblock,
          cookies: downloadOptions.cookies,
          chapters_from_comments: downloadOptions.chaptersFromComments,
        }),
      })

      if (!response.ok) throw new Error("Failed to start download")

      const data = await response.json()
      setActiveTab("progress")
      toast({
        title: "Download Started",
        description: "Your download has been initiated.",
      })

      const intervalId = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${API_BASE}/status/${data.task_id}`)
          if (!statusResponse.ok) throw new Error("Failed to get status")

          const statusData = await statusResponse.json()
          setDownloadStatus(statusData)

          if (statusData.status === "completed") {
            clearInterval(intervalId)
            toast({
              title: "Download Complete",
              description: `Successfully downloaded ${statusData.filename || "your content"}.`,
              variant: "success",
            })
          } else if (statusData.status === "error") {
            clearInterval(intervalId)
            setError(statusData.error || "An error occurred during download")
            toast({
              title: "Download Failed",
              description: statusData.error || "An error occurred during download",
              variant: "destructive",
            })
          }
        } catch (err) {
          clearInterval(intervalId)
          const errorMsg = err instanceof Error ? err.message : "Failed to get download status"
          setError(errorMsg)
          toast({
            title: "Status Error",
            description: errorMsg,
            variant: "destructive",
          })
        }
      }, 1000)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to start download"
      setError(errorMsg)
      toast({
        title: "Download Error",
        description: errorMsg,
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setUrl("")
    setVideoInfo(null)
    setFormats([])
    setDownloadStatus(null)
    setActiveTab("download")
    setError(null)
    setDownloadOptions({
      format: "",
      extractAudio: false,
      audioFormat: "mp3",
      audioQuality: "0",
      embedMetadata: true,
      embedThumbnail: true,
      downloadThumbnail: false,
      downloadSubtitles: false,
      subtitleLanguages: ["en"],
      quality: "best",
      writeDescription: false,
      writeComments: false,
      writeThumbnail: false,
      writeInfoJson: false,
      cookies: true,
      sponsorblock: false,
      chaptersFromComments: false,
    })
    toast({
      title: "Reset Complete",
      description: "Ready for a new download.",
    })
  }

  const shareUrl = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Download this video with Ren YT-DLP',
        text: videoInfo?.title || 'Check out this video',
        url: url,
      })
      .catch((error) => console.log('Error sharing', error));
    } else {
      navigator.clipboard.writeText(url)
        .then(() => {
          toast({
            title: "URL Copied",
            description: "Video URL copied to clipboard.",
          })
        })
        .catch((err) => {
          console.error('Failed to copy: ', err);
        });
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-xl dark:border-primary/20 border-secondary/30 overflow-hidden
      dark:bg-card/50 bg-card/80 rounded-2xl backdrop-blur-sm">
      <CardHeader className="dark:border-b dark:border-primary/20 border-b border-secondary/20 
        dark:bg-primary/5 bg-secondary/10 py-4">
        <CardTitle className="flex items-center gap-3">
          <div className="p-1.5 rounded-full dark:bg-primary/20 bg-secondary/20 flex items-center justify-center">
            <Youtube className="w-5 h-5 dark:text-primary text-secondary-foreground" />
          </div>
          <span className="text-xl font-bold dark:text-white text-foreground">
            Video & Audio Downloader
          </span>
          <div className="hidden sm:block ml-auto">
            <span className="text-xs px-2.5 py-1 rounded-full dark:bg-primary/10 bg-secondary/20 
              dark:text-primary-foreground/80 text-secondary-foreground/80 font-medium">
              Powered by yt-dlp
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-4 dark:bg-destructive/10 bg-destructive/10 text-destructive rounded-lg flex items-center gap-3 
                dark:border border-destructive/30 shadow-sm"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-destructive">Error</p>
                <p className="text-sm opacity-90 text-destructive">{error}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 gap-2 p-1.5 h-auto dark:bg-background/50 bg-background/50 rounded-xl 
            dark:border border-secondary/20 dark:border-primary/20 shadow-sm">
            <TabsTrigger 
              value="download" 
              className="flex items-center gap-2 py-2.5 data-[state=active]:dark:bg-primary/20 data-[state=active]:bg-secondary/30
                data-[state=active]:dark:text-white data-[state=active]:text-foreground data-[state=active]:shadow-sm 
                transition-all duration-300 rounded-lg"
            >
              <Download className="w-4 h-4" /> URL
            </TabsTrigger>
            <TabsTrigger
              value="options"
              disabled={!videoInfo}
              className="flex items-center gap-2 py-2.5 data-[state=active]:dark:bg-primary/20 data-[state=active]:bg-secondary/30
                data-[state=active]:dark:text-white data-[state=active]:text-foreground data-[state=active]:shadow-sm 
                transition-all duration-300 rounded-lg"
            >
              <Settings className="w-4 h-4" /> Options
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              disabled={!downloadStatus}
              className="flex items-center gap-2 py-2.5 data-[state=active]:dark:bg-primary/20 data-[state=active]:bg-secondary/30
                data-[state=active]:dark:text-white data-[state=active]:text-foreground data-[state=active]:shadow-sm 
                transition-all duration-300 rounded-lg"
            >
              <Loader2 className="w-4 h-4" /> Progress
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="download" className="mt-4">
                <UrlTab
                  url={url}
                  setUrl={setUrl}
                  loading={loading}
                  fetchVideoInfo={fetchVideoInfo}
                  isPlaylist={isPlaylist}
                  setIsPlaylist={setIsPlaylist}
                />
              </TabsContent>

              <TabsContent value="options" className="space-y-6">
                {videoInfo && (
                  <>
                    <VideoInfoHeader videoInfo={videoInfo} />
                    
                    {videoInfo && url && (
                      <div className="flex justify-end mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 dark:border-primary/30 border-secondary/30 dark:text-primary-foreground 
                          text-secondary-foreground dark:hover:bg-primary/20 hover:bg-secondary/20 rounded-full px-3 h-8"
                          onClick={shareUrl}
                        >
                          <Share2 className="h-4 w-4" /> Share
                        </Button>
                      </div>
                    )}

                    <div className="space-y-5">
                      <Card className="overflow-hidden dark:border-primary/20 border-secondary/30 shadow-md 
                        dark:bg-card/80 bg-card/90 rounded-xl">
                        <CardHeader className="dark:bg-primary/10 bg-secondary/10 py-3 px-4 border-b 
                          dark:border-primary/20 border-secondary/20">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Settings className="w-4 h-4 dark:text-primary text-secondary-foreground" />
                            Download Options
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-5 space-y-5">
                          <div className="p-4 dark:bg-primary/5 bg-secondary/10 rounded-lg dark:border border-primary/20 
                            border-secondary/20 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Switch
                                id="extract-audio"
                                checked={downloadOptions.extractAudio}
                                onCheckedChange={(v) => updateDownloadOption("extractAudio", v)}
                                className="data-[state=checked]:dark:bg-primary data-[state=checked]:bg-secondary"
                              />
                              <div>
                                <Label htmlFor="extract-audio" className="font-medium">
                                  Extract audio only
                                </Label>
                                <p className="text-xs dark:text-primary-foreground/70 text-secondary-foreground/70 mt-0.5">
                                  Download only the audio track
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              {downloadOptions.extractAudio ? (
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full dark:bg-primary/20 bg-secondary/20">
                                  <Music className="h-4 w-4 dark:text-primary text-secondary-foreground" />
                                  <span className="text-xs dark:text-primary-foreground text-secondary-foreground font-medium">Audio Only</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full dark:bg-primary/10 bg-secondary/10">
                                  <Film className="h-4 w-4 dark:text-primary-foreground/70 text-secondary-foreground/70" />
                                  <span className="text-xs dark:text-primary-foreground/70 text-secondary-foreground/70 font-medium">Video + Audio</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {downloadOptions.extractAudio ? (
                            <AudioOptions downloadOptions={downloadOptions} updateDownloadOption={updateDownloadOption} />
                          ) : videoInfo.is_playlist ? (
                            <div className="dark:text-primary-foreground text-secondary-foreground dark:bg-primary/5 bg-secondary/10 p-4 rounded-lg 
                              dark:border border-primary/20 border-secondary/20 flex items-center">
                              <List className="w-5 h-5 mr-3 dark:text-primary text-secondary-foreground" />
                              <div>
                                <p className="font-medium">Playlist detected</p>
                                <p className="text-sm dark:text-primary-foreground/70 text-secondary-foreground/70">
                                  Format selection not available - downloading all entries with best quality
                                </p>
                              </div>
                            </div>
                          ) : (
                            <VideoFormatSelector
                              formats={formats}
                              downloadOptions={downloadOptions}
                              updateDownloadOption={updateDownloadOption}
                            />
                          )}
                        </CardContent>
                      </Card>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <MetadataOptions downloadOptions={downloadOptions} updateDownloadOption={updateDownloadOption} />
                        <SubtitleOptions downloadOptions={downloadOptions} updateDownloadOption={updateDownloadOption} />
                      </div>

                      <AdditionalFeatures downloadOptions={downloadOptions} updateDownloadOption={updateDownloadOption} />

                      <div className="pt-2">
                        <Button
                          className="w-full py-6 text-base font-semibold dark:bg-gradient-to-r dark:from-primary dark:to-accent/80 
                            bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all duration-300 
                            dark:shadow-lg dark:shadow-primary/20 shadow-lg shadow-secondary/20 rounded-xl"
                          onClick={startDownload}
                          disabled={!downloadOptions.format && !downloadOptions.extractAudio}
                        >
                          <Download className="w-5 h-5 mr-2" />
                          Start Download
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="progress">
                <ProgressTab downloadStatus={downloadStatus} resetForm={resetForm} />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </CardContent>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 dark:bg-background/80 bg-background/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="flex flex-col items-center gap-4 p-8 dark:bg-card bg-card rounded-xl shadow-xl 
                dark:border border-primary/20 border-secondary/30"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full dark:bg-primary/10 bg-secondary/20 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin dark:text-primary text-secondary-foreground" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                    <Youtube className="h-5 w-5 dark:text-primary text-secondary-foreground" />
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">Fetching video information...</p>
                <p className="text-sm dark:text-primary-foreground/70 text-secondary-foreground/70 mt-1">This may take a moment</p>
              </div>
              <div className="mt-1 flex gap-2">
                <Sparkles className="h-4 w-4 dark:text-primary text-secondary-foreground animate-pulse" />
                <Sparkles className="h-4 w-4 dark:text-accent text-primary animate-pulse delay-300" />
                <Sparkles className="h-4 w-4 dark:text-primary text-secondary-foreground animate-pulse delay-700" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

export default YTDLPPage