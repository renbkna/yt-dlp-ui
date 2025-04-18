import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, Settings, Download, AlertCircle, Youtube, List, Share2, Music, Film, Sparkles } from "lucide-react"
import type { DownloadOptions, VideoInfo, VideoFormat, DownloadStatus, ClientCookie } from "@/types"
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
import { ApiDebug } from "@/components/ApiDebug"
import { YoutubeAuthError } from "@/components/YoutubeAuthError"
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
  const [showDebug, setShowDebug] = useState(false)

  // Initialize debug mode based on query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === 'true') {
      setShowDebug(true);
    }
  }, []);

  // Updated DownloadOptions to include clientCookies
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
    useBrowserCookies: true,
    clientCookies: undefined,
    sponsorblock: false,
    chaptersFromComments: false,
  })

  const updateDownloadOption = (key: keyof DownloadOptions, value: string | boolean | unknown) => {
    setDownloadOptions((prev) => ({ ...prev, [key]: value }))
  }

  // Target domains and important cookie names for YouTube
  const targetDomains = ['youtube.com', 'www.youtube.com', '.youtube.com', 'youtu.be', 'google.com', '.google.com'];
  const importantCookieNames = [
    'LOGIN_INFO',
    'SID',
    'HSID',
    'SSID',
    'APISID',
    'SAPISID',
    'CONSENT',
    '__Secure-1PSID',
    '__Secure-3PSID',
    '__Secure-1PAPISID',
    '__Secure-3PAPISID',
    'YSC',
    'VISITOR_INFO1_LIVE'
  ];

  // Extract cookies from the browser
  const extractCookies = async (): Promise<ClientCookie[]> => {
    try {
      // Create an empty array to hold extracted cookies
      const cookies: ClientCookie[] = [];
      
      // Get all cookies from document.cookie
      const currentCookies = document.cookie.split(';');
      
      for (const cookieStr of currentCookies) {
        try {
          const [name, value] = cookieStr.trim().split('=');
          if (name && value) {
            // Check if this is a YouTube related cookie
            const isYouTubeCookie = importantCookieNames.includes(name.trim()) || 
              targetDomains.some(domain => name.trim().includes(domain));
            
            if (isYouTubeCookie) {
              cookies.push({
                domain: 'youtube.com', // Default to youtube.com
                name: name.trim(),
                value: value,
                path: '/',
                secure: true,
                httpOnly: false
              });
            }
          }
        } catch (e) {
          console.warn("Failed to parse cookie:", cookieStr);
        }
      }
      
      // If we're on YouTube, try to extract more cookies using document.domain
      if (window.location.hostname.includes('youtube.com')) {
        cookies.push({
          domain: 'youtube.com',
          name: '_special_extracted_from_youtube',
          value: 'true',
          path: '/',
          secure: true,
          httpOnly: false
        });
      }
      
      // Update state with extracted cookies
      if (cookies.length > 0) {
        setDownloadOptions(prev => ({
          ...prev,
          useBrowserCookies: true,
          clientCookies: cookies
        }));
        
        console.log(`Extracted ${cookies.length} cookies from browser`);
      }
      
      return cookies;
    } catch (err) {
      console.error("Error extracting cookies:", err);
      return [];
    }
  };

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
      console.log(`Fetching video info for URL: ${url}`);
      
      // Extract cookies first if they are not already available
      if (!downloadOptions.clientCookies || downloadOptions.clientCookies.length === 0) {
        try {
          const cookies = await extractCookies();
          console.log(`Extracted ${cookies.length} cookies from browser for initial fetch`);
        } catch (err) {
          console.warn("Failed to extract cookies:", err);
        }
      }
      
      // Prepare request payload for video info - use POST to send cookies directly
      const infoPayload = {
        url: url,
        is_playlist: isPlaylist,
        cookies: downloadOptions.clientCookies
      };
      
      console.log("Sending request with cookies:", {
        ...infoPayload,
        cookies: downloadOptions.clientCookies ? 
          `[${downloadOptions.clientCookies.length} cookies]` : "none"
      });
      
      // Use POST to send cookies directly in request body
      const [infoResponse, formatsResponse] = await Promise.all([
        fetch(`${API_BASE}/info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(infoPayload)
        }),
        fetch(`${API_BASE}/formats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: url,
            is_playlist: isPlaylist,
            cookies: downloadOptions.clientCookies
          })
        })
      ]);
      
      if (!infoResponse.ok) {
        console.error(`Info response error: ${infoResponse.status} ${infoResponse.statusText}`);
        const infoText = await infoResponse.text();
        console.error(`Info response body: ${infoText}`);
        
        // Try to parse the error response as JSON if possible
        let errorDetail = `Failed to fetch video info: ${infoResponse.status}`;
        try {
          const errorJson = JSON.parse(infoText);
          if (errorJson.detail) {
            errorDetail = errorJson.detail;
          }
        } catch (e) {
          // If parsing fails, use the raw text
          if (infoText) errorDetail = infoText;
        }
        
        throw new Error(errorDetail);
      }
      
      if (!formatsResponse.ok) {
        console.error(`Formats response error: ${formatsResponse.status} ${formatsResponse.statusText}`);
        const formatsText = await formatsResponse.text();
        console.error(`Formats response body: ${formatsText}`);
        throw new Error(`Failed to fetch formats: ${formatsResponse.status} ${formatsResponse.statusText}`);
      }

      const info = await infoResponse.json()
      const formatsData = await formatsResponse.json()

      console.log("Successfully fetched video info:", info);
      console.log("Successfully fetched formats:", formatsData);

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
      console.log(`Starting download to: ${API_BASE}/download`);
      
      // Add downloaded cookies to the request
      const requestBody = {
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
        use_browser_cookies: downloadOptions.useBrowserCookies,
        client_cookies: downloadOptions.clientCookies,
        chapters_from_comments: downloadOptions.chaptersFromComments,
      };
      
      console.log("Download request body:", {
        ...requestBody, 
        client_cookies: `[${downloadOptions.clientCookies?.length || 0} cookies]`
      });
      
      const response = await fetch(`${API_BASE}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        console.error(`Download response error: ${response.status} ${response.statusText}`);
        const responseText = await response.text();
        console.error(`Download response body: ${responseText}`);
        
        // Try to parse the error response as JSON if possible
        let errorDetail = `Failed to start download: ${response.status}`;
        try {
          const errorJson = JSON.parse(responseText);
          if (errorJson.detail) {
            errorDetail = errorJson.detail;
          }
        } catch (e) {
          // If parsing fails, use the raw text
          if (responseText) errorDetail = responseText;
        }
        
        throw new Error(errorDetail);
      }

      const data = await response.json()
      console.log("Download started with task ID:", data.task_id);
      
      setActiveTab("progress")
      toast({
        title: "Download Started",
        description: "Your download has been initiated.",
      })

      const intervalId = setInterval(async () => {
        try {
          console.log(`Checking status for task: ${data.task_id}`);
          
          const statusResponse = await fetch(`${API_BASE}/status/${data.task_id}`)
          if (!statusResponse.ok) {
            console.error(`Status response error: ${statusResponse.status} ${statusResponse.statusText}`);
            throw new Error(`Failed to get status: ${statusResponse.status} ${statusResponse.statusText}`);
          }

          const statusData = await statusResponse.json()
          console.log("Status update:", statusData);
          
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
      useBrowserCookies: true,
      clientCookies: undefined,
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
    <>
      {/* Debug Panel (only shown when ?debug=true is in URL) */}
      {showDebug && (
        <div className="w-full max-w-4xl mx-auto mb-4">
          <ApiDebug />
        </div>
      )}
      
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
          {/* Show YouTube Auth Error component if error is related to authentication */}
          {error && <YoutubeAuthError error={error} onRetry={fetchVideoInfo} />}
          
          <AnimatePresence mode="wait">
            {error && !error.includes("Sign in to confirm you're not a bot") && (
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
                    extractCookies={extractCookies}
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
    </>
  )
}

export default YTDLPPage