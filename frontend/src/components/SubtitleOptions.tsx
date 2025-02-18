import React from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { DownloadOptions } from '@/types'

const subtitleLanguages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' }
]

export interface SubtitleOptionsProps {
  downloadOptions: DownloadOptions
  updateDownloadOption: (key: keyof DownloadOptions, value: unknown) => void
}

export const SubtitleOptions: React.FC<SubtitleOptionsProps> = React.memo(
  ({ downloadOptions, updateDownloadOption }) => {
    const selectedLanguage =
      downloadOptions.subtitleLanguages && downloadOptions.subtitleLanguages[0]
        ? downloadOptions.subtitleLanguages[0]
        : ''
    return (
      <div className="space-y-4 p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-2">Subtitle Options</h4>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="download-subtitles"
              checked={!!downloadOptions.downloadSubtitles}
              onCheckedChange={(v) => updateDownloadOption('downloadSubtitles', v)}
            />
            <Label htmlFor="download-subtitles">Download subtitles</Label>
          </div>
          {downloadOptions.downloadSubtitles && (
            <div className="space-y-2 ml-6">
              <Label>Subtitle Language</Label>
              <Select
                value={selectedLanguage}
                onValueChange={(v: string) => updateDownloadOption('subtitleLanguages', [v])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subtitleLanguages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    )
  }
)
SubtitleOptions.displayName = 'SubtitleOptions'
