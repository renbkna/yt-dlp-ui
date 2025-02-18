import React from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DownloadOptions } from '@/types'

const audioFormats = [
  { value: 'mp3', label: 'MP3' },
  { value: 'm4a', label: 'M4A (AAC)' },
  { value: 'wav', label: 'WAV' },
  { value: 'opus', label: 'Opus' },
  { value: 'vorbis', label: 'Vorbis' }
]

const audioQualities = [
  { value: '0', label: 'Best' },
  { value: '2', label: 'High (192kbps)' },
  { value: '5', label: 'Medium (128kbps)' },
  { value: '7', label: 'Low (64kbps)' }
]

export interface AudioOptionsProps {
  downloadOptions: DownloadOptions
  updateDownloadOption: (key: keyof DownloadOptions, value: unknown) => void
}

export const AudioOptions: React.FC<AudioOptionsProps> = React.memo(
  ({ downloadOptions, updateDownloadOption }) => {
    return (
      <div className="ml-6 space-y-4">
        <div className="space-y-2">
          <Label>Audio Format</Label>
          <Select
            value={downloadOptions.audioFormat}
            onValueChange={(v: string) => updateDownloadOption('audioFormat', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {audioFormats.map((format) => (
                <SelectItem key={format.value} value={format.value}>
                  {format.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Audio Quality</Label>
          <Select
            value={downloadOptions.audioQuality}
            onValueChange={(v: string) => updateDownloadOption('audioQuality', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {audioQualities.map((quality) => (
                <SelectItem key={quality.value} value={quality.value}>
                  {quality.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }
)
AudioOptions.displayName = 'AudioOptions'
