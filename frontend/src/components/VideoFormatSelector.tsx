import React, { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DownloadOptions, VideoFormat } from '@/types'

interface ExtendedVideoFormat extends VideoFormat {
  fps?: number
  filesize_approx?: number
}

function getFormatLabel(format: ExtendedVideoFormat): string {
  const parts: string[] = []
  if (format.resolution) parts.push(format.resolution)
  if (format.ext) parts.push(`(${format.ext})`)
  if (format.fps !== undefined) parts.push(`${format.fps}fps`)
  if (format.vcodec && format.vcodec !== 'none') parts.push(`vcodec:${format.vcodec}`)
  if (format.acodec && format.acodec !== 'none') parts.push(`acodec:${format.acodec}`)
  if (format.format_note) parts.push(format.format_note)
  if (format.filesize) {
    const sizeMB = (format.filesize / (1024 * 1024)).toFixed(1)
    parts.push(`${sizeMB}MB`)
  } else if (format.filesize_approx !== undefined) {
    const sizeMB = (format.filesize_approx / (1024 * 1024)).toFixed(1)
    parts.push(`~${sizeMB}MB`)
  }
  return parts.join(' - ') || 'Unknown Format'
}

function groupByResolution(formats: ExtendedVideoFormat[]): Record<string, ExtendedVideoFormat[]> {
  return formats.reduce((acc, format) => {
    const res = format.resolution || 'Unknown'
    if (!acc[res]) acc[res] = []
    acc[res].push(format)
    return acc
  }, {} as Record<string, ExtendedVideoFormat[]>)
}

export interface VideoFormatSelectorProps {
  formats: VideoFormat[]
  downloadOptions: DownloadOptions
  updateDownloadOption: (key: keyof DownloadOptions, value: string | number | boolean) => void
}

export const VideoFormatSelector: React.FC<VideoFormatSelectorProps> = React.memo(
  ({ formats, downloadOptions, updateDownloadOption }) => {
    const extendedFormats = formats as ExtendedVideoFormat[]
    const [outerTab, setOuterTab] = useState<'video' | 'audio' | 'other'>('video')
    const [innerTab, setInnerTab] = useState<string>('')

    const videoFormats = extendedFormats.filter(fmt => fmt.vcodec && fmt.vcodec !== 'none')
    const audioFormats = extendedFormats.filter(fmt => fmt.vcodec === 'none' && fmt.acodec && fmt.acodec !== 'none')
    const otherFormats = extendedFormats.filter(fmt => !fmt.vcodec || (fmt.vcodec === 'none' && (!fmt.acodec || fmt.acodec === 'none')))

    const selectedFormats = outerTab === 'video' ? videoFormats : outerTab === 'audio' ? audioFormats : otherFormats
    const groupedFormats = groupByResolution(selectedFormats)
    const resolutionKeys = Object.keys(groupedFormats).sort((a, b) => {
      const numA = parseInt(a)
      const numB = parseInt(b)
      if (!isNaN(numA) && !isNaN(numB)) return numB - numA
      return a.localeCompare(b)
    })

    useEffect(() => {
      if (!resolutionKeys.includes(innerTab)) {
        setInnerTab(resolutionKeys[0] || '')
      }
    }, [outerTab, resolutionKeys, innerTab])

    const renderFormatCards = (formatList: ExtendedVideoFormat[]) => (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {formatList.map((format) => (
          <Card
            key={format.format_id}
            onClick={() => updateDownloadOption('format', format.format_id)}
            className={`cursor-pointer hover:shadow-lg transition-shadow border-2 ${
              downloadOptions.format === format.format_id ? 'border-primary' : 'border-transparent'
            }`}
          >
            <CardHeader>
              <CardTitle className="text-sm font-semibold">{format.format_id}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs">{getFormatLabel(format)}</CardContent>
          </Card>
        ))}
      </div>
    )

    return (
      <div className="space-y-4">
        <Label>Video Format</Label>
        <Tabs value={outerTab} onValueChange={(v: string) => setOuterTab(v as 'video' | 'audio' | 'other')}>
          <TabsList className="mb-4">
            <TabsTrigger value="video">Video</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>
        </Tabs>
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
          <div className="text-sm text-muted-foreground">No formats available for {outerTab}.</div>
        )}
      </div>
    )
  }
)
VideoFormatSelector.displayName = 'VideoFormatSelector'
