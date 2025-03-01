import React from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DownloadOptions } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Image, FileJson, MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface MetadataOptionsProps {
  downloadOptions: DownloadOptions
  updateDownloadOption: (key: keyof DownloadOptions, value: unknown) => void
}

export const MetadataOptions: React.FC<MetadataOptionsProps> = React.memo(
  ({ downloadOptions, updateDownloadOption }) => {
    return (
      <Card className="dark:border-primary/20 border-secondary/30 rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="pb-3 dark:bg-primary/5 bg-secondary/10 border-b dark:border-primary/20 border-secondary/20">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileJson className="h-4 w-4 dark:text-primary text-secondary-foreground" />
            Metadata Options
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="grid gap-2">
            <div className="flex items-center justify-between p-3 rounded-lg dark:hover:bg-primary/5 hover:bg-secondary/5 transition-colors
              dark:border-primary/20 border-secondary/20">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 rounded-full dark:bg-primary/10 bg-secondary/10">
                  <FileText className="h-4 w-4 dark:text-primary text-secondary-foreground" />
                </div>
                <div>
                  <Label htmlFor="embed-metadata" className="cursor-pointer font-medium">Embed metadata</Label>
                  <p className="text-xs dark:text-primary-foreground/60 text-secondary-foreground/60 mt-1">
                    Add title, artist, and other details to the file
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {downloadOptions.embedMetadata && 
                  <Badge variant="outline" className="text-xs dark:bg-primary/10 bg-secondary/10 
                  dark:border-primary/30 border-secondary/30 dark:text-primary-foreground text-secondary-foreground">Recommended</Badge>}
                <Switch
                  id="embed-metadata"
                  checked={!!downloadOptions.embedMetadata}
                  onCheckedChange={(v) => updateDownloadOption('embedMetadata', v)}
                  className="data-[state=checked]:dark:bg-primary data-[state=checked]:bg-secondary"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg dark:hover:bg-primary/5 hover:bg-secondary/5 transition-colors
              dark:border-primary/20 border-secondary/20">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 rounded-full dark:bg-primary/10 bg-secondary/10">
                  <Image className="h-4 w-4 dark:text-primary text-secondary-foreground" />
                </div>
                <div>
                  <Label htmlFor="embed-thumbnail" className="cursor-pointer font-medium">Embed thumbnail</Label>
                  <p className="text-xs dark:text-primary-foreground/60 text-secondary-foreground/60 mt-1">
                    Add video thumbnail to the media file
                  </p>
                </div>
              </div>
              <Switch
                id="embed-thumbnail"
                checked={!!downloadOptions.embedThumbnail}
                onCheckedChange={(v) => updateDownloadOption('embedThumbnail', v)}
                className="data-[state=checked]:dark:bg-primary data-[state=checked]:bg-secondary"
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg dark:hover:bg-primary/5 hover:bg-secondary/5 transition-colors
              dark:border-primary/20 border-secondary/20">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 rounded-full dark:bg-primary/10 bg-secondary/10">
                  <FileText className="h-4 w-4 dark:text-primary text-secondary-foreground" />
                </div>
                <div>
                  <Label htmlFor="write-description" className="cursor-pointer font-medium">Save description</Label>
                  <p className="text-xs dark:text-primary-foreground/60 text-secondary-foreground/60 mt-1">
                    Save video description as a text file
                  </p>
                </div>
              </div>
              <Switch
                id="write-description"
                checked={!!downloadOptions.writeDescription}
                onCheckedChange={(v) => updateDownloadOption('writeDescription', v)}
                className="data-[state=checked]:dark:bg-primary data-[state=checked]:bg-secondary"
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg dark:hover:bg-primary/5 hover:bg-secondary/5 transition-colors
              dark:border-primary/20 border-secondary/20">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 rounded-full dark:bg-primary/10 bg-secondary/10">
                  <MessageSquare className="h-4 w-4 dark:text-primary text-secondary-foreground" />
                </div>
                <div>
                  <Label htmlFor="write-comments" className="cursor-pointer font-medium">Save comments</Label>
                  <p className="text-xs dark:text-primary-foreground/60 text-secondary-foreground/60 mt-1">
                    Save video comments as a JSON file
                  </p>
                </div>
              </div>
              <Switch
                id="write-comments"
                checked={!!downloadOptions.writeComments}
                onCheckedChange={(v) => updateDownloadOption('writeComments', v)}
                className="data-[state=checked]:dark:bg-primary data-[state=checked]:bg-secondary"
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg dark:hover:bg-primary/5 hover:bg-secondary/5 transition-colors
              dark:border-primary/20 border-secondary/20">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 rounded-full dark:bg-primary/10 bg-secondary/10">
                  <FileJson className="h-4 w-4 dark:text-primary text-secondary-foreground" />
                </div>
                <div>
                  <Label htmlFor="write-info-json" className="cursor-pointer font-medium">Save info JSON</Label>
                  <p className="text-xs dark:text-primary-foreground/60 text-secondary-foreground/60 mt-1">
                    Save complete video information
                  </p>
                </div>
              </div>
              <Switch
                id="write-info-json"
                checked={!!downloadOptions.writeInfoJson}
                onCheckedChange={(v) => updateDownloadOption('writeInfoJson', v)}
                className="data-[state=checked]:dark:bg-primary data-[state=checked]:bg-secondary"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
)
MetadataOptions.displayName = 'MetadataOptions'