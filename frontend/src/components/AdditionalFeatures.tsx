import React from 'react'
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DownloadOptions } from "@/types"
import { 
  Settings2, 
  ShieldAlert, 
  Cookie, 
  FastForward, 
  Bookmark, 
  Info,
  SkipForward
} from "lucide-react"
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AdditionalFeaturesProps {
  downloadOptions: DownloadOptions
  updateDownloadOption: (key: keyof DownloadOptions, value: unknown) => void
}

export function AdditionalFeatures({ downloadOptions, updateDownloadOption }: AdditionalFeaturesProps) {
  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-3 bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings2 className="h-4 w-4" />
            Additional Features
          </CardTitle>
          <Badge variant="outline" className="text-xs">Advanced</Badge>
        </div>
        <CardDescription>
          These settings enable special features of yt-dlp
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid gap-3">
          <TooltipProvider>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors">
                <div className="flex items-center space-x-3">
                  <ShieldAlert className="h-4 w-4 text-green-500" />
                  <Label htmlFor="sponsorblock" className="cursor-pointer flex items-center">
                    SponsorBlock
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground ml-1.5 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p>Automatically skip sponsor segments in videos using community-contributed data.</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                </div>
                <Switch
                  id="sponsorblock"
                  checked={downloadOptions.sponsorblock}
                  onCheckedChange={(v) => updateDownloadOption("sponsorblock", v)}
                />
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors">
                <div className="flex items-center space-x-3">
                  <Cookie className="h-4 w-4 text-amber-500" />
                  <Label htmlFor="cookies" className="cursor-pointer flex items-center">
                    Use browser cookies
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground ml-1.5 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p>Use your browser cookies for age-restricted content or private videos.</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                </div>
                <Switch
                  id="cookies"
                  checked={downloadOptions.cookies}
                  onCheckedChange={(v) => updateDownloadOption("cookies", v)}
                />
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors">
                <div className="flex items-center space-x-3">
                  <Bookmark className="h-4 w-4 text-blue-500" />
                  <Label htmlFor="chapters" className="cursor-pointer flex items-center">
                    Chapters from comments
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground ml-1.5 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p>Extract chapter information from video comments. Useful for videos with community timestamps.</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                </div>
                <Switch
                  id="chapters"
                  checked={downloadOptions.chaptersFromComments}
                  onCheckedChange={(v) => updateDownloadOption("chaptersFromComments", v)}
                />
              </div>
              
              <Separator />
              
              <div className="bg-muted/30 p-3 rounded-md">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <FastForward className="h-4 w-4 text-primary" />
                  <span>SponsorBlock Features</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  When enabled, SponsorBlock will remove these segments:
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge variant="secondary" className="text-xs">Sponsor</Badge>
                  <Badge variant="secondary" className="text-xs">Intro</Badge>
                  <Badge variant="secondary" className="text-xs">Outro</Badge>
                  <Badge variant="secondary" className="text-xs">Self-promo</Badge>
                  <Badge variant="secondary" className="text-xs">Preview</Badge>
                  <Badge variant="secondary" className="text-xs">Non-music</Badge>
                </div>
              </div>
            </div>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  )
}
