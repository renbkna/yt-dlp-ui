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
import { Search, Film, Filter, X, Check, HelpCircle, Download, Music, PlayCircle, Video, Sparkles } from "lucide-react"
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
  const [bestQualitySelected, setBestQualitySelected] = useState(false)
  
  // Function to format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown"
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Byte'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }
  
  // Get format resolution as a label
  const getResolutionLabel = (format: VideoFormat) => {
    if (!format.resolution && (!format.vcodec || format.vcodec === 'none')) {
      return 'Audio only';
    }
    
    // If we have a format_note that includes resolution info, prefer it
    if (format.format_note?.includes('p')) {
      return format.format_note;
    }
    
    // Otherwise, use the resolution
    return format.resolution || 'Unknown';
  }
  
  // Function to extract resolution height
  const getResolutionHeight = (format: VideoFormat): number => {
    // Try to extract from resolution string (e.g. "1280x720" -> 720)
    if (format.resolution) {
      const match = format.resolution.match(/\d+x(\d+)/);
      if (match && match[1]) return parseInt(match[1]);
    }
    
    // Try to extract from format_note (e.g. "720p" -> 720)
    if (format.format_note) {
      const match = format.format_note.match(/(\d+)p/);
      if (match && match[1]) return parseInt(match[1]);
    }
    
    return 0;
  }

  // Function to get a quality score for sorting
  const getQualityScore = (format: VideoFormat) => {
    const height = getResolutionHeight(format);
    
    // For audio-only streams, we'll use a negative score so they appear below videos
    if (!format.vcodec || format.vcodec === 'none') {
      return -1;
    }
    
    return height;
  }
  
  // Filter and sort formats
  const filteredFormats = useMemo(() => {
    return formats
      .filter(format => {
        // Filter out storyboard formats
        if (format.format_id.startsWith('sb') || 
            format.format_note?.includes('storyboard')) {
          return false;
        }
        
        // Apply search filter
        if (searchTerm && !format.format_note?.toLowerCase().includes(searchTerm.toLowerCase()) && 
            !format.format_id.includes(searchTerm.toLowerCase()) &&
            !format.ext.includes(searchTerm.toLowerCase()) &&
            !format.resolution?.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false
        }
        
        // Apply audio/video filters
        if (showAudioOnly && format.vcodec && format.vcodec !== 'none') return false
        if (showVideoOnly && (!format.vcodec || format.vcodec === 'none')) return false
        
        return true
      })
      .sort((a, b) => {
        // Sort by quality score (higher first)
        const qualityA = getQualityScore(a);
        const qualityB = getQualityScore(b);
        
        if (qualityA !== qualityB) {
          return qualityB - qualityA;
        }
        
        // If same quality, prefer formats with both audio and video
        const aHasBoth = a.vcodec !== 'none' && a.acodec !== 'none';
        const bHasBoth = b.vcodec !== 'none' && b.acodec !== 'none';
        
        if (aHasBoth && !bHasBoth) return -1;
        if (!aHasBoth && bHasBoth) return 1;
        
        // Finally sort by filesize if available
        if (a.filesize && b.filesize) return b.filesize - a.filesize;
        
        return 0;
      })
  }, [formats, searchTerm, showAudioOnly, showVideoOnly])

  // Improved best quality selection function with comprehensive format ID detection
  const getBestQualityFormat = () => {
    if (!formats || formats.length === 0) return null;
    
    console.log("Finding best quality format from", formats.length, "formats");
    
    // Define format ID priority lists by resolution and codec based on the provided list
    
    // 4K (2160p) formats
    const fourKFormats = [
      "625", // 3840x2160 Video: vp09 .mp4
      "401", // 2160p Video: av01 .mp4
      "313", // 2160p Video: vp9 .webm
      "337", "315", "272", "701", "271", "699", "700",
      "266", "334", "698", "697", "694", "696", "695"
    ];
    
    // 1440p formats
    const qhdFormats = [
      "620", // 2560x1440 Video: vp09 .mp4
      "271", // 1440p Video: vp9 .webm
      "400", // 1440p Video: av01 .mp4
      "308", "336", "335", "270", "330", "269",
      "265", "333", "332", "331"
    ];
    
    // 1080p formats
    const fullHdFormats = [
      "270", // 1920x1080 Video: avc1 .mp4
      "248", // 1080p Video: vp9 .webm
      "137", // 1080p Video: avc1 .mp4
      "614", // 1920x1080 Video: vp09 .mp4
      "399", // 1080p Video: av01 .mp4
      "303", "299", "302", "298"
    ];
    
    // 720p formats
    const hdFormats = [
      "232", // 1280x720 Video: avc1 .mp4
      "247", // 720p Video: vp9 .webm
      "136", // 720p Video: avc1 .mp4
      "609", // 1280x720 Video: vp09 .mp4
      "398", // 720p Video: av01 .mp4
      "302", "298", "297", "22"
    ];
    
    // 480p formats
    const sdFormats = [
      "231", // 854x480 Video: avc1 .mp4
      "135", // 480p Video: avc1 .mp4
      "606", // 854x480 Video: vp09 .mp4
      "244", // 480p Video: vp9 .webm
      "397" // 480p Video: av01 .mp4
    ];
    
    // 360p formats
    const lowFormats = [
      "18", // 360p Video: avc1 Audio: mp4a .mp4 Video+Audio
      "230", // 640x360 Video: avc1 .mp4
      "134", // 360p Video: avc1 .mp4
      "605", // 640x360 Video: vp09 .mp4
      "243", // 360p Video: vp9 .webm
      "396" // 360p Video: av01 .mp4
    ];
    
    // Combined formats (with both audio and video)
    const combinedFormats = [
      "22", "18", "37", "38", "46", "82", "83", "84", "85", "100", "101", "102"
    ];
    
    // Prioritize by resolution
    const formatPriority = [
      ...fourKFormats,
      ...qhdFormats, 
      ...fullHdFormats, 
      ...hdFormats, 
      ...sdFormats, 
      ...combinedFormats, 
      ...lowFormats
    ];
    
    // Step 1: Look through our priority list first
    for (const formatId of formatPriority) {
      const format = formats.find(f => f.format_id === formatId);
      if (format) {
        console.log(`Selected format from priority list: ${formatId}`);
        return format;
      }
    }
    
    // Step 2: If none of our known format IDs match, select based on resolution
    // Start with 4K
    const has4k = formats.filter(f => 
      f.vcodec && f.vcodec !== 'none' && 
      getResolutionHeight(f) >= 2160 && 
      !f.format_id.startsWith('sb')
    );
    
    if (has4k.length > 0) {
      const best4k = has4k.sort((a, b) => parseInt(b.format_id) - parseInt(a.format_id))[0];
      console.log(`Selected 4K format: ${best4k.format_id}`);
      return best4k;
    }
    
    // Try 1440p
    const has1440p = formats.filter(f => 
      f.vcodec && f.vcodec !== 'none' && 
      getResolutionHeight(f) >= 1440 && 
      getResolutionHeight(f) < 2160 &&
      !f.format_id.startsWith('sb')
    );
    
    if (has1440p.length > 0) {
      const best1440p = has1440p.sort((a, b) => parseInt(b.format_id) - parseInt(a.format_id))[0];
      console.log(`Selected 1440p format: ${best1440p.format_id}`);
      return best1440p;
    }
    
    // Try 1080p
    const has1080p = formats.filter(f => 
      f.vcodec && f.vcodec !== 'none' && 
      getResolutionHeight(f) >= 1080 && 
      getResolutionHeight(f) < 1440 &&
      !f.format_id.startsWith('sb')
    );
    
    if (has1080p.length > 0) {
      const best1080p = has1080p.sort((a, b) => parseInt(b.format_id) - parseInt(a.format_id))[0];
      console.log(`Selected 1080p format: ${best1080p.format_id}`);
      return best1080p;
    }
    
    // Try 720p
    const has720p = formats.filter(f => 
      f.vcodec && f.vcodec !== 'none' && 
      getResolutionHeight(f) >= 720 && 
      getResolutionHeight(f) < 1080 &&
      !f.format_id.startsWith('sb')
    );
    
    if (has720p.length > 0) {
      const best720p = has720p.sort((a, b) => parseInt(b.format_id) - parseInt(a.format_id))[0];
      console.log(`Selected 720p format: ${best720p.format_id}`);
      return best720p;
    }
    
    // Step 3: Fall back to any video format, preferring higher resolution
    const anyVideo = formats.filter(f => 
      f.vcodec && f.vcodec !== 'none' && 
      !f.format_id.startsWith('sb')
    );
    
    if (anyVideo.length > 0) {
      // Sort by resolution height
      const bestVideo = anyVideo.sort((a, b) => {
        const heightA = getResolutionHeight(a);
        const heightB = getResolutionHeight(b);
        
        if (heightA !== heightB) {
          return heightB - heightA;
        }
        
        // If heights are the same, prefer by format ID
        return parseInt(b.format_id) - parseInt(a.format_id);
      })[0];
      
      console.log(`Selected fallback video format: ${bestVideo.format_id}`);
      return bestVideo;
    }
    
    // Last resort - return the first format
    console.log(`Last resort - using first format: ${formats[0].format_id}`);
    return formats[0];
  };
  
  const handleBestQualitySelect = () => {
    const bestFormat = getBestQualityFormat();
    if (bestFormat) {
      updateDownloadOption("format", bestFormat.format_id);
      setBestQualitySelected(true);
      
      // Reset the animation after a short delay
      setTimeout(() => setBestQualitySelected(false), 1500);
      
      // Scroll to the selected format in the list
      setTimeout(() => {
        const selectedElement = document.getElementById(`format-${bestFormat.format_id}`);
        selectedElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  return (
    <div className="space-y-4">
      {/* Best Quality Button */}
      <Button
        variant="default"
        size="default"
        className="w-full py-3 dark:bg-gradient-to-r dark:from-primary dark:to-accent/80 
          bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all duration-300 
          dark:shadow-md dark:shadow-primary/20 shadow-md shadow-secondary/20 rounded-xl font-medium"
        onClick={handleBestQualitySelect}
        disabled={!formats || formats.length === 0}
        data-testid="best-quality-button"
      >
        <Sparkles className={`w-4 h-4 mr-2 ${bestQualitySelected ? 'dark:text-green-300 text-green-300' : ''}`} />
        <span>
          {bestQualitySelected ? 'Best Quality Selected!' : 'Select Best Quality'}
        </span>
      </Button>
      
      <div className="flex items-center justify-center gap-2">
        <div className="h-px dark:bg-primary/20 bg-secondary/20 flex-1" />
        <span className="text-xs font-medium dark:text-primary-foreground/70 text-secondary-foreground/70">OR SELECT MANUALLY</span>
        <div className="h-px dark:bg-primary/20 bg-secondary/20 flex-1" />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Film className="h-5 w-5 dark:text-primary text-secondary-foreground" />
          <h3 className="text-lg font-medium">Available Formats</h3>
        </div>
        
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Badge 
            variant={showVideoOnly ? "default" : "outline"} 
            className={`cursor-pointer ${showVideoOnly ? 
              'dark:bg-primary bg-secondary dark:text-white text-white hover:dark:bg-primary/90 hover:bg-secondary/90' : 
              'dark:border-primary/40 border-secondary/40 dark:text-primary-foreground text-secondary-foreground hover:dark:bg-primary/20 hover:bg-secondary/20'}`}
            onClick={() => {
              setShowVideoOnly(!showVideoOnly)
              if (!showVideoOnly) setShowAudioOnly(false)
            }}
          >
            <Video className="mr-1 h-3 w-3" /> Video
            {showVideoOnly && <X className="ml-1 h-3 w-3" />}
          </Badge>
          
          <Badge 
            variant={showAudioOnly ? "default" : "outline"} 
            className={`cursor-pointer ${showAudioOnly ? 
              'dark:bg-primary bg-secondary dark:text-white text-white hover:dark:bg-primary/90 hover:bg-secondary/90' : 
              'dark:border-primary/40 border-secondary/40 dark:text-primary-foreground text-secondary-foreground hover:dark:bg-primary/20 hover:bg-secondary/20'}`}
            onClick={() => {
              setShowAudioOnly(!showAudioOnly)
              if (!showAudioOnly) setShowVideoOnly(false)
            }}
          >
            <Music className="mr-1 h-3 w-3" /> Audio
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
          className="pl-9 pr-9 dark:border-primary/30 border-secondary/30 dark:focus:border-primary focus:border-secondary 
            dark:bg-background/50 bg-white/70 rounded-lg"
        />
        {searchTerm && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-full 
            dark:hover:bg-primary/20 hover:bg-secondary/20"
            onClick={() => setSearchTerm("")}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      <div className="dark:border-primary/20 border-secondary/30 border rounded-xl shadow-sm overflow-hidden">
        <ScrollArea className="h-[320px]">
          <RadioGroup 
            value={downloadOptions.format}
            onValueChange={(value) => updateDownloadOption("format", value)}
          >
            <Table>
              <TableHeader className="sticky top-0 dark:bg-background/95 bg-white/95 backdrop-blur-sm z-10 
                dark:border-b border-b dark:border-primary/20 border-secondary/20">
                <TableRow className="dark:bg-primary/5 bg-secondary/10">
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="w-[80px] dark:text-primary-foreground/80 text-secondary-foreground/80">ID</TableHead>
                  <TableHead className="dark:text-primary-foreground/80 text-secondary-foreground/80">Format</TableHead>
                  <TableHead className="text-right dark:text-primary-foreground/80 text-secondary-foreground/80">Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFormats.length > 0 ? (
                  filteredFormats.map((format) => {
                    const hasVideo = format.vcodec && format.vcodec !== 'none'
                    const hasAudio = format.acodec && format.acodec !== 'none'
                    const isSelected = downloadOptions.format === format.format_id
                    const resHeight = getResolutionHeight(format);
                    const isHighRes = resHeight >= 720;
                    
                    return (
                      <TableRow 
                        key={format.format_id}
                        id={`format-${format.format_id}`}
                        className={`
                          cursor-pointer transition-all dark:hover:bg-primary/5 hover:bg-secondary/5
                          ${isSelected ? 'dark:bg-primary/10 bg-secondary/10 dark:hover:bg-primary/20 hover:bg-secondary/20 dark:border-l-2 border-l-2 dark:border-l-primary border-l-secondary' : ''}
                        `}
                        onClick={() => updateDownloadOption("format", format.format_id)}
                      >
                        <TableCell className="p-0 pl-4">
                          <RadioGroupItem
                            value={format.format_id}
                            id={`radio-${format.format_id}`}
                            className="sr-only"
                          />
                          <div className={`h-5 w-5 rounded-full flex items-center justify-center border-2 ${
                            isSelected 
                              ? 'dark:border-primary border-secondary dark:bg-primary bg-secondary dark:text-white text-white' 
                              : 'dark:border-primary/30 border-secondary/30'
                          }`}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-medium">
                          {format.format_id}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="font-medium flex items-center gap-2">
                              {!hasVideo && hasAudio ? (
                                <Music className="h-4 w-4 dark:text-blue-400 text-blue-500" />
                              ) : (
                                <PlayCircle className="h-4 w-4 dark:text-primary text-secondary" />
                              )}
                              
                              <span className={isHighRes ? "dark:text-white text-foreground" : ""}>
                                {getResolutionLabel(format)}
                                {format.format_note && format.format_note !== getResolutionLabel(format) && 
                                  ` • ${format.format_note}`}
                              </span>
                              
                              {isHighRes && hasVideo && hasAudio && (
                                <Sparkles className="h-3.5 w-3.5 dark:text-green-400 text-green-500" />
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-1 mt-1">
                              {hasVideo && (
                                <Badge variant="outline" className={`text-xs py-0 h-5 dark:border-primary/30 border-secondary/30 
                                  dark:bg-primary/10 bg-secondary/10 dark:text-primary-foreground/80 text-secondary-foreground/80`}>
                                  Video: {format.vcodec?.split('.')[0]}
                                </Badge>
                              )}
                              {hasAudio && (
                                <Badge variant="outline" className={`text-xs py-0 h-5 dark:border-primary/30 border-secondary/30 
                                  dark:bg-primary/10 bg-secondary/10 dark:text-primary-foreground/80 text-secondary-foreground/80`}>
                                  Audio: {format.acodec?.split('.')[0]}
                                </Badge>
                              )}
                              <Badge variant="outline" className={`text-xs py-0 h-5 dark:border-primary/30 border-secondary/30 
                                dark:bg-primary/10 bg-secondary/10 dark:text-primary-foreground/80 text-secondary-foreground/80`}>
                                .{format.ext}
                              </Badge>
                              
                              {hasVideo && hasAudio && (
                                <Badge className="text-xs py-0 h-5 dark:bg-primary/20 bg-secondary/20 
                                  dark:text-primary-foreground text-secondary-foreground dark:border-primary/30 border-secondary/30">
                                  Video+Audio
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm dark:text-primary-foreground/80 text-secondary-foreground/80">
                          {formatFileSize(format.filesize)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 dark:text-primary-foreground/60 text-secondary-foreground/60">
                      <div className="flex flex-col items-center gap-3">
                        <Filter className="h-8 w-8 dark:text-primary-foreground/40 text-secondary-foreground/40" />
                        <p>No formats match your filter criteria</p>
                        {(searchTerm || showAudioOnly || showVideoOnly) && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSearchTerm("")
                              setShowAudioOnly(false)
                              setShowVideoOnly(false)
                            }}
                            className="mt-2 dark:border-primary/30 border-secondary/30 dark:text-primary-foreground 
                              text-secondary-foreground dark:hover:bg-primary/20 hover:bg-secondary/20 rounded-full"
                          >
                            <X className="mr-1 h-3 w-3" /> Clear all filters
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
              <div className="flex items-center text-sm dark:text-primary-foreground/80 text-secondary-foreground/80">
                <HelpCircle className="h-4 w-4 mr-1" />
                <span>Format Selection Help</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs dark:bg-background bg-white dark:border-primary/30 border-secondary/30">
              <p>• <span className="font-bold">High resolution formats</span> are highlighted</p>
              <p>• <span className="font-bold">Video+Audio</span> formats require no additional processing</p>
              <p>• File size is estimated and may vary</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {downloadOptions.format && (
          <Badge variant="outline" className="px-3 py-1.5 dark:bg-primary/10 bg-secondary/10 
            dark:border-primary/30 border-secondary/30 dark:text-primary-foreground text-secondary-foreground">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Selected: <span className="font-mono ml-1.5 font-bold">{downloadOptions.format}</span>
          </Badge>
        )}
      </div>
    </div>
  )
}