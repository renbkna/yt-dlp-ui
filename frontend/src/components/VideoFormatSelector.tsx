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
import { Search, Film, Filter, X, Check, HelpCircle, Download, CheckCircle } from "lucide-react"
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

  // Completely revised function to determine the best quality format
  const getBestQualityFormat = () => {
    if (!formats || formats.length === 0) return null;
    
    console.log("Available formats:", formats);
    
    // Helper function to extract resolution as a number (height)
    const getHeight = (format: VideoFormat): number => {
      // From format_note (e.g. "1080p" -> 1080)
      if (format.format_note) {
        const match = format.format_note.match(/(\d+)p/);
        if (match && match[1]) return parseInt(match[1]);
      }
      
      // From resolution (e.g. "1280x720" -> 720)
      if (format.resolution) {
        const match = format.resolution.match(/\d+x(\d+)/);
        if (match && match[1]) return parseInt(match[1]);
      }
      
      return 0;
    };
    
    // Best known high quality format IDs for YouTube
    const highQualityIds = ['270', '614', '137', '248', '299', '303', '308', '315', '571', '401', '699', '700', '701', '136', '247'];
    
    // First, try to find formats with explicitly known high quality IDs
    const knownHighQualityFormats = formats.filter(f => 
      highQualityIds.includes(f.format_id) && 
      f.vcodec && f.vcodec !== 'none' // Must have video
    );
    
    console.log("Known high quality formats:", knownHighQualityFormats);
    
    if (knownHighQualityFormats.length > 0) {
      // Sort by our preferred order (the order in highQualityIds array)
      const bestFormat = knownHighQualityFormats.sort((a, b) => {
        return highQualityIds.indexOf(a.format_id) - highQualityIds.indexOf(b.format_id);
      })[0];
      
      console.log("Selected known high quality format:", bestFormat);
      return bestFormat;
    }
    
    // Next best approach: Sort ALL formats by resolution and pick the highest
    const videoFormats = formats.filter(f => 
      f.vcodec && f.vcodec !== 'none' && // Must have video
      f.format_id !== 'sb0' && f.format_id !== 'sb1' && // Exclude storyboards
      f.format_id !== 'sb2' && f.format_id !== 'sb3' && 
      !f.format_note?.includes('storyboard') // Double check no storyboards
    );
    
    console.log("All video formats:", videoFormats);
    
    if (videoFormats.length > 0) {
      // Sort by height (resolution) in descending order
      const sortedByResolution = [...videoFormats].sort((a, b) => {
        const heightA = getHeight(a);
        const heightB = getHeight(b);
        
        console.log(`Format ${a.format_id}: ${a.format_note}, res=${a.resolution}, height=${heightA}`);
        
        if (heightA !== heightB) {
          return heightB - heightA; // Higher resolution first
        }
        
        // If same resolution, prefer format with audio
        const aHasAudio = a.acodec && a.acodec !== 'none';
        const bHasAudio = b.acodec && b.acodec !== 'none';
        
        if (aHasAudio && !bHasAudio) return -1;
        if (!aHasAudio && bHasAudio) return 1;
        
        // If still tied, prefer by filesize
        if (a.filesize && b.filesize) {
          return b.filesize - a.filesize;
        }
        
        // If no good comparison method is available, prioritize by format_id numeric value
        // This is not ideal but better than nothing
        const numA = parseInt(a.format_id) || 0;
        const numB = parseInt(b.format_id) || 0;
        return numB - numA; // Higher format IDs often (but not always) indicate better quality
      });
        
      console.log("Best format by resolution:", sortedByResolution[0]);
      return sortedByResolution[0];
    }
    
    // Fallback to any available format
    return formats[0];
  };
  
  const handleBestQualitySelect = () => {
    const bestFormat = getBestQualityFormat();
    if (bestFormat) {
      updateDownloadOption("format", bestFormat.format_id);
      // Scroll to the selected format in the list (optional enhancement)
      setTimeout(() => {
        const selectedElement = document.getElementById(`format-${bestFormat.format_id}`);
        selectedElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  return (
    <div className="space-y-4">
      {/* Redesigned Select Best Quality button to match project style */}
      <Button
        variant="default"
        size="lg"
        className="w-full relative z-20 bg-primary hover:bg-primary/90 shadow transition-all flex items-center justify-center gap-2"
        onClick={handleBestQualitySelect}
        disabled={!formats || formats.length === 0}
        data-testid="best-quality-button"
      >
        <CheckCircle className="w-5 h-5" />
        <span>Select Best Quality</span>
      </Button>
      
      <div className="text-sm text-muted-foreground text-center">
        Or select a specific format manually:
      </div>

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
