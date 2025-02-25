import { useState, useMemo } from "react"
import { DownloadOptions, VideoFormat } from "@/types"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Search, Film, Filter, X, Check, HelpCircle, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface VideoFormatSelectorProps {
  formats: VideoFormat[]
  downloadOptions: DownloadOptions
  updateDownloadOption: (key: keyof DownloadOptions, value: string | boolean | unknown) => void
}

export function VideoFormatSelector({ 
  formats, 
  downloadOptions, 
  updateDownloadOption 
}: VideoFormatSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showAudioOnly, setShowAudioOnly] = useState(false)
  const [showVideoOnly, setShowVideoOnly] = useState(false)
  
  // Function to format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown"
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Byte'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }
  
  // Filter and sort formats
  const filteredFormats = useMemo(() => {
    return formats
      .filter(format => {
        // Apply search filter
        if (searchTerm && !format.format_note?.toLowerCase().includes(searchTerm.toLowerCase()) && 
            !format.format_id.includes(searchTerm.toLowerCase()) &&
            !format.ext.includes(searchTerm.toLowerCase()) &&
            !format.resolution?.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false
        }
        
        // Apply audio/video filters
        if (showAudioOnly && format.vcodec && format.vcodec !== 'none') return false
        if (showVideoOnly && format.acodec && format.acodec !== 'none') return false
        
        return true
      })
      .sort((a, b) => {
        // Sort by filesize (largest first) if available
        if (a.filesize && b.filesize) return b.filesize - a.filesize
        return 0
      })
  }, [formats, searchTerm, showAudioOnly, showVideoOnly])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Select Format</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={showVideoOnly ? "default" : "outline"} 
            className="cursor-pointer"
            onClick={() => {
              setShowVideoOnly(!showVideoOnly)
              if (!showVideoOnly) setShowAudioOnly(false)
            }}
          >
            <Film className="mr-1 h-3 w-3" /> Video
            {showVideoOnly && <X className="ml-1 h-3 w-3" />}
          </Badge>
          
          <Badge variant={showAudioOnly ? "default" : "outline"} 
            className="cursor-pointer"
            onClick={() => {
              setShowAudioOnly(!showAudioOnly)
              if (!showAudioOnly) setShowVideoOnly(false)
            }}
          >
            <Film className="mr-1 h-3 w-3" /> Audio
            {showAudioOnly && <X className="ml-1 h-3 w-3" />}
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center gap-2 relative">
        <Search className="h-4 w-4 absolute left-3 text-muted-foreground" />
        <Input 
          placeholder="Search formats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchTerm && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => setSearchTerm("")}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      <div className="border rounded-md">
        <ScrollArea className="h-[360px]">
          <RadioGroup 
            value={downloadOptions.format}
            onValueChange={(value) => updateDownloadOption("format", value)}
          >
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="w-[100px]">Format ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFormats.length > 0 ? (
                  filteredFormats.map((format) => {
                    const hasVideo = format.vcodec && format.vcodec !== 'none'
                    const hasAudio = format.acodec && format.acodec !== 'none'
                    
                    return (
                      <TableRow 
                        key={format.format_id}
                        className={`
                          cursor-pointer transition-colors hover:bg-accent
                          ${downloadOptions.format === format.format_id ? 'bg-primary/10 hover:bg-primary/10' : ''}
                        `}
                        onClick={() => updateDownloadOption("format", format.format_id)}
                      >
                        <TableCell className="p-0 pl-4">
                          <RadioGroupItem
                            value={format.format_id}
                            id={`format-${format.format_id}`}
                            className="sr-only"
                          />
                          <div className={`h-5 w-5 rounded-full flex items-center justify-center border ${
                            downloadOptions.format === format.format_id 
                              ? 'border-primary bg-primary text-primary-foreground' 
                              : 'border-muted-foreground/30'
                          }`}>
                            {downloadOptions.format === format.format_id && <Check className="h-3 w-3" />}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{format.format_id}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {format.resolution || 'Audio only'} 
                              {format.format_note && ` • ${format.format_note}`}
                            </span>
                            <div className="flex gap-1 mt-0.5">
                              {hasVideo && (
                                <Badge variant="outline" className="text-xs py-0 h-5">
                                  Video: {format.vcodec?.split('.')[0]}
                                </Badge>
                              )}
                              {hasAudio && (
                                <Badge variant="outline" className="text-xs py-0 h-5">
                                  Audio: {format.acodec?.split('.')[0]}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs py-0 h-5">
                                .{format.ext}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatFileSize(format.filesize)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Filter className="h-6 w-6" />
                        <p>No formats match your filter criteria</p>
                        {(searchTerm || showAudioOnly || showVideoOnly) && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSearchTerm("")
                              setShowAudioOnly(false)
                              setShowVideoOnly(false)
                            }}
                          >
                            Clear filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </RadioGroup>
        </ScrollArea>
      </div>
      
      <div className="flex items-center justify-between pt-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>For best results with video + audio, choose a format that includes both. 
              Or select a video-only format, and audio will be automatically added.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {downloadOptions.format && (
          <Badge variant="outline" className="px-3 py-1">
            <Download className="h-3 w-3 mr-1" />
            Format selected: <span className="font-mono ml-1">{downloadOptions.format}</span>
          </Badge>
        )}
      </div>
    </div>
  )
}
