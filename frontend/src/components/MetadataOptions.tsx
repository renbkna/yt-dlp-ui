import React from 'react'
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DownloadOptions } from "@/types"

interface MetadataOptionsProps {
  downloadOptions: DownloadOptions
  updateDownloadOption: (key: keyof DownloadOptions, value: unknown) => void
}

export const MetadataOptions = ({ downloadOptions, updateDownloadOption }: MetadataOptionsProps) => (
  <div className="space-y-4 p-4 bg-muted rounded-lg">
    <h4 className="font-medium mb-2">Metadata Options</h4>
    <div className="grid gap-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="embed-metadata"
          checked={downloadOptions.embedMetadata}
          onCheckedChange={v => updateDownloadOption('embedMetadata', v)}
        />
        <Label htmlFor="embed-metadata">Embed metadata</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="embed-thumbnail"
          checked={downloadOptions.embedThumbnail}
          onCheckedChange={v => updateDownloadOption('embedThumbnail', v)}
        />
        <Label htmlFor="embed-thumbnail">Embed thumbnail</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="write-description"
          checked={downloadOptions.writeDescription}
          onCheckedChange={v => updateDownloadOption('writeDescription', v)}
        />
        <Label htmlFor="write-description">Save video description</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="write-comments"
          checked={downloadOptions.writeComments}
          onCheckedChange={v => updateDownloadOption('writeComments', v)}
        />
        <Label htmlFor="write-comments">Save video comments</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="write-info-json"
          checked={downloadOptions.writeInfoJson}
          onCheckedChange={v => updateDownloadOption('writeInfoJson', v)}
        />
        <Label htmlFor="write-info-json">Save video information (JSON)</Label>
      </div>
    </div>
  </div>
)