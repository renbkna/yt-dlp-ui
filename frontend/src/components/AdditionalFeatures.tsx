import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DownloadOptions } from "@/types"
import { 
  ShieldAlert, 
  FastForward, 
  Bookmark, 
  Info,
} from "lucide-react"
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ClientCookieExtractor } from "@/components/ClientCookieExtractor"

interface AdditionalFeaturesProps {
  downloadOptions: DownloadOptions
  updateDownloadOption: (key: keyof DownloadOptions, value: unknown) => void
}

export function AdditionalFeatures({ downloadOptions, updateDownloadOption }: AdditionalFeaturesProps) {
  // Handle cookie extraction
  const handleCookiesChange = (enabled: boolean, cookies: any[] | undefined) => {
    updateDownloadOption("useBrowserCookies", enabled);
    if (cookies) {
      updateDownloadOption("clientCookies", cookies);
    } else {
      updateDownloadOption("clientCookies", undefined);
    }
  };
  
  return (
    <Card className="dark:border-primary/20 border-secondary/30 rounded-xl shadow-sm">
      <CardHeader className="pb-3 dark:bg-primary/5 bg-secondary/10 border-b dark:border-primary/20 border-secondary/20">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bookmark className="h-4 w-4 dark:text-primary text-secondary-foreground" />
            Additional Features
          </CardTitle>
          <Badge variant="outline" className="text-xs dark:bg-primary/10 bg-secondary/10 
            dark:text-primary-foreground text-secondary-foreground dark:border-primary/30 border-secondary/30">
            Advanced
          </Badge>
        </div>
        <CardDescription className="dark:text-primary-foreground/60 text-secondary-foreground/60">
          These settings enable special features of yt-dlp
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid gap-3">
          <TooltipProvider>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg dark:hover:bg-primary/5 hover:bg-secondary/5 transition-colors
                dark:border-primary/20 border-secondary/20">
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 rounded-full dark:bg-green-500/10 bg-green-500/10">
                    <ShieldAlert className="h-4 w-4 dark:text-green-400 text-green-500" />
                  </div>
                  <div>
                    <Label htmlFor="sponsorblock" className="cursor-pointer font-medium flex items-center">
                      SponsorBlock
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 dark:text-primary-foreground/40 text-secondary-foreground/40 ml-1.5 cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs dark:bg-background bg-white dark:border-primary/30 border-secondary/30">
                          <p>Automatically skip sponsor segments in videos using community-contributed data.</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <p className="text-xs dark:text-primary-foreground/60 text-secondary-foreground/60 mt-1">
                      Skip ads, intros, outros and other segments
                    </p>
                  </div>
                </div>
                <Switch
                  id="sponsorblock"
                  checked={downloadOptions.sponsorblock}
                  onCheckedChange={(v) => updateDownloadOption("sponsorblock", v)}
                  className="data-[state=checked]:dark:bg-green-500 data-[state=checked]:bg-green-500"
                />
              </div>
              
              {/* Client cookie extractor component replaces the old browser cookies toggle */}
              <ClientCookieExtractor 
                cookiesEnabled={downloadOptions.useBrowserCookies}
                onCookiesChange={handleCookiesChange}
              />
              
              <div className="flex items-center justify-between p-3 rounded-lg dark:hover:bg-primary/5 hover:bg-secondary/5 transition-colors
                dark:border-primary/20 border-secondary/20">
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 rounded-full dark:bg-blue-500/10 bg-blue-500/10">
                    <Bookmark className="h-4 w-4 dark:text-blue-400 text-blue-500" />
                  </div>
                  <div>
                    <Label htmlFor="chapters" className="cursor-pointer font-medium flex items-center">
                      Chapters from comments
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 dark:text-primary-foreground/40 text-secondary-foreground/40 ml-1.5 cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs dark:bg-background bg-white dark:border-primary/30 border-secondary/30">
                          <p>Extract chapter information from video comments. Useful for videos with community timestamps.</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <p className="text-xs dark:text-primary-foreground/60 text-secondary-foreground/60 mt-1">
                      Extract chapter markers from video comments
                    </p>
                  </div>
                </div>
                <Switch
                  id="chapters"
                  checked={downloadOptions.chaptersFromComments}
                  onCheckedChange={(v) => updateDownloadOption("chaptersFromComments", v)}
                  className="data-[state=checked]:dark:bg-blue-500 data-[state=checked]:bg-blue-500"
                />
              </div>
              
              <Separator className="dark:bg-primary/10 bg-secondary/10" />
              
              <div className="dark:bg-primary/5 bg-secondary/5 p-4 rounded-lg dark:border border-primary/20 border-secondary/20">
                <div className="flex items-center gap-2 font-medium mb-3">
                  <FastForward className="h-4 w-4 dark:text-primary text-secondary-foreground" />
                  <span>SponsorBlock Features</span>
                </div>
                <p className="text-sm dark:text-primary-foreground/70 text-secondary-foreground/70 mb-3">
                  When enabled, SponsorBlock will remove these segments:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge className="text-xs dark:bg-primary/10 bg-secondary/10 
                    dark:text-primary-foreground text-secondary-foreground">
                    Sponsor
                  </Badge>
                  <Badge className="text-xs dark:bg-primary/10 bg-secondary/10 
                    dark:text-primary-foreground text-secondary-foreground">
                    Intro
                  </Badge>
                  <Badge className="text-xs dark:bg-primary/10 bg-secondary/10 
                    dark:text-primary-foreground text-secondary-foreground">
                    Outro
                  </Badge>
                  <Badge className="text-xs dark:bg-primary/10 bg-secondary/10 
                    dark:text-primary-foreground text-secondary-foreground">
                    Self-promo
                  </Badge>
                  <Badge className="text-xs dark:bg-primary/10 bg-secondary/10 
                    dark:text-primary-foreground text-secondary-foreground">
                    Preview
                  </Badge>
                  <Badge className="text-xs dark:bg-primary/10 bg-secondary/10 
                    dark:text-primary-foreground text-secondary-foreground">
                    Non-music
                  </Badge>
                </div>
              </div>
            </div>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  )
}