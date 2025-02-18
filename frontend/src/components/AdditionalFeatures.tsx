import React from 'react'
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DownloadOptions } from "@/types"

interface AdditionalFeaturesProps {
  downloadOptions: DownloadOptions
  updateDownloadOption: (key: keyof DownloadOptions, value: unknown) => void
}

export const AdditionalFeatures = ({ downloadOptions, updateDownloadOption }: AdditionalFeaturesProps) => (
  <div className="space-y-4 p-4 bg-muted rounded-lg">
    <h4 className="font-medium mb-2">Additional Features</h4>
    <div className="grid gap-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="sponsorblock"
          checked={downloadOptions.sponsorblock}
          onCheckedChange={v => updateDownloadOption('sponsorblock', v)}
        />
        <Label htmlFor="sponsorblock">Remove sponsor segments (SponsorBlock)</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="chapters"
          checked={downloadOptions.chaptersFromComments}
          onCheckedChange={v => updateDownloadOption('chaptersFromComments', v)}
        />
        <Label htmlFor="chapters">Extract chapters from comments</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="cookies"
          checked={downloadOptions.cookies}
          onCheckedChange={v => updateDownloadOption('cookies', v)}
        />
        <Label htmlFor="cookies">Use browser cookies (for private videos)</Label>
      </div>
    </div>
  </div>
)