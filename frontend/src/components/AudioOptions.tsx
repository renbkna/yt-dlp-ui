import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { DownloadOptions } from "@/types"
import { Music, Activity, Volume2, Check, Headphones, FileBadge, FileAudio } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AudioOptionsProps {
  downloadOptions: DownloadOptions
  updateDownloadOption: (key: keyof DownloadOptions, value: string | boolean | unknown) => void
}

export function AudioOptions({ downloadOptions, updateDownloadOption }: AudioOptionsProps) {
  const audioFormats = [
    { 
      value: "mp3", 
      label: "MP3", 
      description: "Most compatible format",
      icon: <FileAudio className="h-5 w-5 text-blue-500" />,
      color: "border-blue-200 hover:border-blue-300 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-50"
    },
    { 
      value: "m4a", 
      label: "M4A", 
      description: "Better quality than MP3",
      icon: <FileAudio className="h-5 w-5 text-purple-500" />,
      color: "border-purple-200 hover:border-purple-300 data-[state=checked]:border-purple-500 data-[state=checked]:bg-purple-50"
    },
    { 
      value: "opus", 
      label: "Opus", 
      description: "Best quality, less compatible",
      icon: <Music className="h-5 w-5 text-green-500" />,
      color: "border-green-200 hover:border-green-300 data-[state=checked]:border-green-500 data-[state=checked]:bg-green-50"
    },
    { 
      value: "wav", 
      label: "WAV", 
      description: "Lossless, very large files",
      icon: <FileBadge className="h-5 w-5 text-red-500" />,
      color: "border-red-200 hover:border-red-300 data-[state=checked]:border-red-500 data-[state=checked]:bg-red-50"
    },
    { 
      value: "flac", 
      label: "FLAC", 
      description: "Lossless, compressed",
      icon: <FileBadge className="h-5 w-5 text-amber-500" />,
      color: "border-amber-200 hover:border-amber-300 data-[state=checked]:border-amber-500 data-[state=checked]:bg-amber-50"
    },
    { 
      value: "vorbis", 
      label: "OGG", 
      description: "Open source format",
      icon: <FileBadge className="h-5 w-5 text-teal-500" />,
      color: "border-teal-200 hover:border-teal-300 data-[state=checked]:border-teal-500 data-[state=checked]:bg-teal-50"
    },
  ]
  
  const audioQualities = [
    { value: "0", label: "Best Quality" },
    { value: "3", label: "High Quality" },
    { value: "5", label: "Good Quality" },
    { value: "7", label: "Medium Quality" },
    { value: "9", label: "Low Quality" }
  ]
  
  const getQualityLabel = (value: string) => {
    const qualityOption = audioQualities.find(q => q.value === value);
    return qualityOption ? qualityOption.label : "Best Quality";
  }
  
  return (
    <TooltipProvider>
      <Card className="border border-primary/20 shadow-md overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500"></div>
        <CardContent className="pt-6">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Headphones className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Audio Format</h3>
              </div>
              
              <RadioGroup 
                value={downloadOptions.audioFormat}
                onValueChange={(value) => updateDownloadOption("audioFormat", value)}
                className="grid grid-cols-2 md:grid-cols-3 gap-3"
              >
                {audioFormats.map((format) => (
                  <Tooltip key={format.value}>
                    <TooltipTrigger asChild>
                      <div 
                        className={`relative ${downloadOptions.audioFormat === format.value ? 'z-10' : ''}`}
                        data-state={downloadOptions.audioFormat === format.value ? "checked" : "unchecked"}
                      >
                        <Label
                          htmlFor={`format-${format.value}`}
                          className={`
                            relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all
                            ${format.color}
                            ${downloadOptions.audioFormat === format.value 
                              ? 'shadow-md' 
                              : 'hover:shadow-sm'
                            }
                          `}
                        >
                          <RadioGroupItem 
                            value={format.value} 
                            id={`format-${format.value}`} 
                            className="sr-only" 
                          />
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {format.icon}
                              <span className="font-medium">{format.label}</span>
                            </div>
                            
                            {downloadOptions.audioFormat === format.value && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-white"
                              >
                                <Check className="h-3 w-3" />
                              </motion.div>
                            )}
                          </div>
                          
                          <span className="text-xs text-muted-foreground mt-2">{format.description}</span>
                        </Label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>{format.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </RadioGroup>
            </div>
            
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Audio Quality</h3>
                </div>
                
                <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {getQualityLabel(downloadOptions.audioQuality)}
                </div>
              </div>
              
              <div className="px-2">
                <Select
                  value={downloadOptions.audioQuality}
                  onValueChange={(value) => updateDownloadOption("audioQuality", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select audio quality" />
                  </SelectTrigger>
                  <SelectContent>
                    {audioQualities.map((quality) => (
                      <SelectItem key={quality.value} value={quality.value}>
                        {quality.label} {quality.value === "0" && "♪ (recommended)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex items-center justify-between px-1 mt-4">
                  <div className="flex flex-col items-center">
                    <Volume2 className="h-6 w-6 text-green-500" />
                    <span className="text-xs text-muted-foreground mt-1">Highest</span>
                  </div>
                  
                  <div className="hidden sm:block">
                    <span className="text-xs text-muted-foreground px-1 py-0.5 rounded-full border">
                      Value: {downloadOptions.audioQuality}
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <Volume2 className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs text-muted-foreground mt-1">Lowest</span>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-md border border-border/50">
                <p className="flex items-center gap-1">
                  <FileBadge className="h-3.5 w-3.5 inline" />
                  <span>
                    Lower values (0-3) produce larger files with better quality. Higher values (7-9) reduce file size but may affect audio quality.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}