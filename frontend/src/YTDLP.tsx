import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, Settings, Download, AlertCircle, Youtube, List } from "lucide-react"
import type { DownloadOptions, VideoInfo, VideoFormat, DownloadStatus } from "@/types"
import { UrlTab } from "@/components/UrlTab"
import { VideoInfoHeader } from "@/components/VideoInfoHeader"
import { AudioOptions } from "@/components/AudioOptions"
import { VideoFormatSelector } from "@/components/VideoFormatSelector"
import { MetadataOptions } from "@/components/MetadataOptions"
import { AdditionalFeatures } from "@/components/AdditionalFeatures"
import { SubtitleOptions } from "@/components/SubtitleOptions"
import { ProgressTab } from "@/components/ProgressTab"

const YTDLPPage = () => {
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
    if (!url) return
    setLoading(true)
    setError(null)
    try {
      const [infoResponse, formatsResponse] = await Promise.all([
        fetch(`http://localhost:8000/api/info?url=${encodeURIComponent(url)}&is_playlist=${isPlaylist}`),
        fetch(`http://localhost:8000/api/formats?url=${encodeURIComponent(url)}&is_playlist=${isPlaylist}`),
      ])
      if (!infoResponse.ok || !formatsResponse.ok) {
        throw new Error("Failed to fetch video info")
      }

      const info = await infoResponse.json()
      const formatsData = await formatsResponse.json()

      if (formatsData.is_playlist) {
        setVideoInfo({ ...info, is_playlist: true })
        setFormats([])
      } else {
        setVideoInfo({ ...info, is_playlist: false })
        setFormats(formatsData.formats || [])
      }

      setActiveTab("options")
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const startDownload = async () => {
    try {
      setError(null)
      const response = await fetch("http://localhost:8000/api/download", {
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
        }),
      })

      if (!response.ok) throw new Error("Failed to start download")

      const data = await response.json()
      setActiveTab("progress")

      const intervalId = setInterval(async () => {
        try {
          const statusResponse = await fetch(`http://localhost:8000/api/status/${data.task_id}`)
          if (!statusResponse.ok) throw new Error("Failed to get status")

          const statusData = await statusResponse.json()
          setDownloadStatus(statusData)

          if (statusData.status === "completed" || statusData.status === "error") {
            clearInterval(intervalId)
          }
        } catch (err) {
          clearInterval(intervalId)
          setError(err instanceof Error ? err.message : "Failed to get download status")
        }
      }, 1000)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to start download")
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
      cookies: false,
      sponsorblock: true,
      chaptersFromComments: false,
    })
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-xl">
      <CardHeader className="border-b bg-muted/50">
        <CardTitle className="flex items-center gap-3 text-2xl font-bold">
          <Youtube className="w-8 h-8 text-red-500" />
          YT-DLP Web Interface
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        {error && (
          <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 gap-4 p-1 h-auto bg-muted rounded-lg">
            <TabsTrigger value="download" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Download className="w-4 h-4" /> URL
            </TabsTrigger>
            <TabsTrigger
              value="options"
              disabled={!videoInfo}
              className="flex items-center gap-2 data-[state=active]:bg-background"
            >
              <Settings className="w-4 h-4" /> Options
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              disabled={!downloadStatus}
              className="flex items-center gap-2 data-[state=active]:bg-background"
            >
              <Loader2 className="w-4 h-4" /> Progress
            </TabsTrigger>
          </TabsList>

          <TabsContent value="download" className="mt-6">
            <UrlTab
              url={url}
              setUrl={setUrl}
              loading={loading}
              fetchVideoInfo={fetchVideoInfo}
              isPlaylist={isPlaylist}
              setIsPlaylist={setIsPlaylist}
            />
          </TabsContent>

          <TabsContent value="options" className="space-y-8">
            {videoInfo && (
              <>
                <VideoInfoHeader videoInfo={videoInfo} />

                <div className="space-y-8">
                  <div className="grid gap-8">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="extract-audio"
                          checked={downloadOptions.extractAudio}
                          onCheckedChange={(v) => updateDownloadOption("extractAudio", v)}
                        />
                        <Label htmlFor="extract-audio" className="font-medium">
                          Extract audio only
                        </Label>
                      </div>

                      {downloadOptions.extractAudio ? (
                        <AudioOptions downloadOptions={downloadOptions} updateDownloadOption={updateDownloadOption} />
                      ) : videoInfo.is_playlist ? (
                        <div className="text-muted-foreground bg-muted p-4 rounded-md">
                          <List className="w-5 h-5 inline-block mr-2" />
                          Playlist format selection not available - downloading all entries
                        </div>
                      ) : (
                        <VideoFormatSelector
                          formats={formats}
                          downloadOptions={downloadOptions}
                          updateDownloadOption={updateDownloadOption}
                        />
                      )}
                    </div>

                    <MetadataOptions downloadOptions={downloadOptions} updateDownloadOption={updateDownloadOption} />

                    <AdditionalFeatures downloadOptions={downloadOptions} updateDownloadOption={updateDownloadOption} />

                    <SubtitleOptions downloadOptions={downloadOptions} updateDownloadOption={updateDownloadOption} />
                  </div>

                  <Button
                    className="w-full mt-8 h-12 text-lg"
                    size="lg"
                    onClick={startDownload}
                    disabled={!downloadOptions.format && !downloadOptions.extractAudio}
                  >
                    <Download className="w-5 h-5 mr-3" />
                    Start Download
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="progress">
            <ProgressTab downloadStatus={downloadStatus} resetForm={resetForm} />
          </TabsContent>
        </Tabs>
      </CardContent>

      {loading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4 p-6 bg-card rounded-lg shadow-lg">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium text-muted-foreground">Fetching video information...</p>
          </div>
        </div>
      )}
    </Card>
  )
}

export default YTDLPPage
