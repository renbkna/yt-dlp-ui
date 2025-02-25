import React from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DownloadOptions } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Image, FileJson, MessageSquare, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface MetadataOptionsProps {
  downloadOptions: DownloadOptions
  updateDownloadOption: (key: keyof DownloadOptions, value: unknown) => void
}

export const MetadataOptions: React.FC<MetadataOptionsProps> = React.memo(
  ({ downloadOptions, updateDownloadOption }) => {
    return (
      <Card className="border-primary/10">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="h-4 w-4" />
            Metadata Options
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid gap-3">
            <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors">
              <div className="flex items-center space-x-3">
                <FileText className="h-4 w-4 text-primary" />
                <Label htmlFor="embed-metadata" className="cursor-pointer">Embed metadata</Label>
              </div>
              <div className="flex items-center gap-3">
                {downloadOptions.embedMetadata && 
                  <Badge variant="outline" className="text-xs">Recommended</Badge>}
                <Switch
                  id="embed-metadata"
                  checked={!!downloadOptions.embedMetadata}
                  onCheckedChange={(v) => updateDownloadOption('embedMetadata', v)}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors">
              <div className="flex items-center space-x-3">
                <Image className="h-4 w-4 text-primary" />
                <Label htmlFor="embed-thumbnail" className="cursor-pointer">Embed thumbnail</Label>
              </div>
              <Switch
                id="embed-thumbnail"
                checked={!!downloadOptions.embedThumbnail}
                onCheckedChange={(v) => updateDownloadOption('embedThumbnail', v)}
              />
            </div>
            
            <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors">
              <div className="flex items-center space-x-3">
                <FileText className="h-4 w-4 text-primary" />
                <Label htmlFor="write-description" className="cursor-pointer">Save video description</Label>
              </div>
              <Switch
                id="write-description"
                checked={!!downloadOptions.writeDescription}
                onCheckedChange={(v) => updateDownloadOption('writeDescription', v)}
              />
            </div>
            
            <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-4 w-4 text-primary" />
                <Label htmlFor="write-comments" className="cursor-pointer">Save video comments</Label>
              </div>
              <Switch
                id="write-comments"
                checked={!!downloadOptions.writeComments}
                onCheckedChange={(v) => updateDownloadOption('writeComments', v)}
              />
            </div>
            
            <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors">
              <div className="flex items-center space-x-3">
                <FileJson className="h-4 w-4 text-primary" />
                <Label htmlFor="write-info-json" className="cursor-pointer">Save video information (JSON)</Label>
              </div>
              <Switch
                id="write-info-json"
                checked={!!downloadOptions.writeInfoJson}
                onCheckedChange={(v) => updateDownloadOption('writeInfoJson', v)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
)
MetadataOptions.displayName = 'MetadataOptions'
