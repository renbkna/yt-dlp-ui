import React, { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DownloadOptions, VideoFormat } from "@/types"

// Extend VideoFormat to include additional properties that might be present.
interface ExtendedVideoFormat extends VideoFormat {
  fps?: number
  filesize_approx?: number
}

// Build a detailed label from a format object
function getFormatLabel(format: ExtendedVideoFormat): string {
  const parts: string[] = []

  if (format.resolution) {
    parts.push(format.resolution)
  }
  if (format.ext) {
    parts.push(`(${format.ext})`)
  }
  if (format.fps !== undefined) {
    parts.push(`${format.fps}fps`)
  }
  if (format.vcodec && format.vcodec !== "none") {
    parts.push(`vcodec:${format.vcodec}`)
  }
  if (format.acodec && format.acodec !== "none") {
    parts.push(`acodec:${format.acodec}`)
  }
  if (format.format_note) {
    parts.push(format.format_note)
  }
  if (format.filesize) {
    const sizeMB = (format.filesize / (1024 * 1024)).toFixed(1)
    parts.push(`${sizeMB}MB`)
  } else if (format.filesize_approx !== undefined) {
    const sizeMB = (format.filesize_approx / (1024 * 1024)).toFixed(1)
    parts.push(`~${sizeMB}MB`)
  }
  return parts.join(" - ") || "Unknown Format"
}

// Group formats by resolution (fall back to "Unknown" if not provided)
function groupByResolution(
  formats: ExtendedVideoFormat[]
): Record<string, ExtendedVideoFormat[]> {
  return formats.reduce((acc, format) => {
    const res = format.resolution || "Unknown"
    if (!acc[res]) {
      acc[res] = []
    }
    acc[res].push(format)
    return acc
  }, {} as Record<string, ExtendedVideoFormat[]>)
}

// Instead of using "any", we define a union type for allowed values.
type DownloadOptionValue = string | number | boolean

interface VideoFormatSelectorProps {
  formats: VideoFormat[]
  downloadOptions: DownloadOptions
  updateDownloadOption: (key: keyof DownloadOptions, value: DownloadOptionValue) => void
}

export const VideoFormatSelector = ({
  formats,
  downloadOptions,
  updateDownloadOption,
}: VideoFormatSelectorProps) => {
  // Cast formats to ExtendedVideoFormat[] so we can safely access fps and filesize_approx.
  const extendedFormats = formats as ExtendedVideoFormat[]

  // Outer tab state: category selection ("video", "audio", or "other")
  const [outerTab, setOuterTab] = useState<"video" | "audio" | "other">("video")
  // Inner tab state: resolution grouping (a string value)
  const [innerTab, setInnerTab] = useState<string>("")

  // Categorize the formats into video, audio, and other.
  const videoFormats = extendedFormats.filter(
    (fmt) => fmt.vcodec && fmt.vcodec !== "none"
  )
  const audioFormats = extendedFormats.filter(
    (fmt) => fmt.vcodec === "none" && fmt.acodec && fmt.acodec !== "none"
  )
  const otherFormats = extendedFormats.filter(
    (fmt) => !fmt.vcodec || (fmt.vcodec === "none" && (!fmt.acodec || fmt.acodec === "none"))
  )

  // Select the formats for the current outer tab.
  const selectedFormats =
    outerTab === "video"
      ? videoFormats
      : outerTab === "audio"
      ? audioFormats
      : otherFormats

  // Group the selected formats by resolution.
  const groupedFormats = groupByResolution(selectedFormats)
  const resolutionKeys = Object.keys(groupedFormats).sort((a, b) => {
    // Try to sort numeric resolutions descending (e.g. "1080" > "720")
    const numA = parseInt(a)
    const numB = parseInt(b)
    if (!isNaN(numA) && !isNaN(numB)) {
      return numB - numA
    }
    return a.localeCompare(b)
  })

  // When outerTab or resolutionKeys change, update the inner tab if necessary.
  useEffect(() => {
    if (!resolutionKeys.includes(innerTab)) {
      setInnerTab(resolutionKeys[0] || "")
    }
  }, [outerTab, resolutionKeys, innerTab])

  // Render the format cards in a responsive grid layout.
  const renderFormatCards = (formatList: ExtendedVideoFormat[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {formatList.map((format) => (
        <Card
  key={format.format_id}
  onClick={() => updateDownloadOption("format", format.format_id)}
  className={`cursor-pointer hover:shadow-lg transition-shadow border-2 ${
    downloadOptions.format === format.format_id ? "border-primary" : "border-transparent"
  }`}
        >
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              {format.format_id}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            {getFormatLabel(format)}
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      <Label>Video Format</Label>
      {/* Outer Tabs: Category selection */}
      <Tabs
        value={outerTab}
        onValueChange={(v: string) => setOuterTab(v as "video" | "audio" | "other")}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="video">Video</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Inner Tabs: Group by resolution */}
      {resolutionKeys.length > 0 ? (
        <Tabs value={innerTab} onValueChange={(v: string) => setInnerTab(v)}>
          <TabsList className="mb-4">
            {resolutionKeys.map((res) => (
              <TabsTrigger key={res} value={res}>
                {res}
              </TabsTrigger>
            ))}
          </TabsList>
          {resolutionKeys.map((res) => (
            <TabsContent key={res} value={res}>
              {renderFormatCards(groupedFormats[res])}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="text-sm text-muted-foreground">
          No formats available for {outerTab}.
        </div>
      )}
    </div>
  )
}
