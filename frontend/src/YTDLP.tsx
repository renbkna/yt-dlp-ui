import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, Settings, Download, AlertCircle, Youtube, List, Share2 } from "lucide-react"
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
    <Card className="w-full max-w-4xl mx-auto shadow-lg border-violet-500/30 overflow-hidden bg-black">
      <CardHeader className="border-b border-violet-500/30 bg-violet-900/20 py-4">
        <CardTitle className="flex items-center gap-2">
          <Youtube className="w-5 h-5 text-violet-400" />
          <span className="text-xl text-white">
            YT-DLP Web Interface
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-5 space-y-6">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-3 border border-destructive/30"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-destructive">Error</p>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <TabsList className="grid w-full grid-cols-3 gap-4 p-1 h-auto bg-violet-900/20 rounded-lg border border-violet-500/30">
            <TabsTrigger 
              value="download" 
              className="flex items-center gap-2 data-[state=active]:bg-violet-900/50 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-300"
            >
              <Download className="w-4 h-4" /> URL
            </TabsTrigger>
            <TabsTrigger
              value="options"
              disabled={!videoInfo}
              className="flex items-center gap-2 data-[state=active]:bg-violet-900/50 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-300"
            >
              <Settings className="w-4 h-4" /> Options
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              disabled={!downloadStatus}
              className="flex items-center gap-2 data-[state=active]:bg-violet-900/50 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-300"
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
                          className="flex items-center gap-2 border-violet-500/30 text-violet-300 hover:bg-violet-500/20 hover:text-white rounded-full px-3 h-8"
                          onClick={shareUrl}
                        >
                          <Share2 className="h-4 w-4" /> Share
                        </Button>
                      </div>
                    )}

                    <div className="space-y-6">
                      <Card className="overflow-hidden border-violet-500/30 shadow-lg bg-gradient-to-b from-black to-violet-950/40 rounded-xl">
                        <CardHeader className="bg-violet-900/30 py-3">
                          <CardTitle className="text-lg flex items-center gap-2 text-white">
                            <Settings className="w-4 h-4" />
                            Download Options
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-6 space-y-5">
                          <div className="p-3 bg-violet-900/20 rounded-lg border border-violet-500/30 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="extract-audio"
                                checked={downloadOptions.extractAudio}
                                onCheckedChange={(v) => updateDownloadOption("extractAudio", v)}
                                className="data-[state=checked]:bg-violet-500"
                              />
                              <Label htmlFor="extract-audio" className="font-medium text-white">
                                Extract audio only
                              </Label>
                            </div>
                            <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-1 rounded-full border border-violet-500/30">
                              {downloadOptions.extractAudio ? "Audio" : "Video + Audio"}
                            </span>
                          </div>

                          {downloadOptions.extractAudio ? (
                            <AudioOptions downloadOptions={downloadOptions} updateDownloadOption={updateDownloadOption} />
                          ) : videoInfo.is_playlist ? (
                            <div className="text-violet-300 bg-violet-900/20 p-4 rounded-md border border-violet-500/30 flex items-center">
                              <List className="w-5 h-5 mr-3 text-violet-400" />
                              <div>
                                <p className="font-medium text-white">Playlist detected</p>
                                <p className="text-sm">Format selection not available - downloading all entries with best quality</p>
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

                      <Button
                        className="w-full h-11 text-base bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 transition-all duration-300 shadow-md shadow-violet-900/30 rounded-lg font-medium"
                        onClick={startDownload}
                        disabled={!downloadOptions.format && !downloadOptions.extractAudio}
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Start Download
                      </Button>
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="flex flex-col items-center gap-4 p-6 bg-background rounded-xl shadow-xl border border-violet-500/30"
            >
              <div className="relative">
                <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Youtube className="h-5 w-5 text-violet-400" />
                </div>
              </div>
              <p className="text-lg font-medium text-white">Fetching video information...</p>
              <p className="text-sm text-violet-300">This may take a moment</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

export default YTDLPPage