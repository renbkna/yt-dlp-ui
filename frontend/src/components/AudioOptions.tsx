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
      icon: <FileAudio className="h-5 w-5 dark:text-blue-400 text-blue-500" />,
      color: "dark:border-primary/20 border-secondary/30 dark:data-[state=checked]:border-primary dark:data-[state=checked]:bg-primary/10 data-[state=checked]:border-secondary data-[state=checked]:bg-secondary/10"
    },
    { 
      value: "m4a", 
      label: "M4A", 
      description: "Better quality than MP3",
      icon: <FileAudio className="h-5 w-5 dark:text-purple-400 text-purple-500" />,
      color: "dark:border-primary/20 border-secondary/30 dark:data-[state=checked]:border-primary dark:data-[state=checked]:bg-primary/10 data-[state=checked]:border-secondary data-[state=checked]:bg-secondary/10"
    },
    { 
      value: "opus", 
      label: "Opus", 
      description: "Best quality, less compatible",
      icon: <Music className="h-5 w-5 dark:text-green-400 text-green-500" />,
      color: "dark:border-primary/20 border-secondary/30 dark:data-[state=checked]:border-primary dark:data-[state=checked]:bg-primary/10 data-[state=checked]:border-secondary data-[state=checked]:bg-secondary/10"
    },
    { 
      value: "wav", 
      label: "WAV", 
      description: "Lossless, very large files",
      icon: <FileBadge className="h-5 w-5 dark:text-red-400 text-red-500" />,
      color: "dark:border-primary/20 border-secondary/30 dark:data-[state=checked]:border-primary dark:data-[state=checked]:bg-primary/10 data-[state=checked]:border-secondary data-[state=checked]:bg-secondary/10"
    },
    { 
      value: "flac", 
      label: "FLAC", 
      description: "Lossless, compressed",
      icon: <FileBadge className="h-5 w-5 dark:text-amber-400 text-amber-500" />,
      color: "dark:border-primary/20 border-secondary/30 dark:data-[state=checked]:border-primary dark:data-[state=checked]:bg-primary/10 data-[state=checked]:border-secondary data-[state=checked]:bg-secondary/10"
    },
    { 
      value: "vorbis", 
      label: "OGG", 
      description: "Open source format",
      icon: <FileBadge className="h-5 w-5 dark:text-teal-400 text-teal-500" />,
      color: "dark:border-primary/20 border-secondary/30 dark:data-[state=checked]:border-primary dark:data-[state=checked]:bg-primary/10 data-[state=checked]:border-secondary data-[state=checked]:bg-secondary/10"
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
      <Card className="dark:border-primary/20 border-secondary/30 shadow-md overflow-hidden rounded-xl">
        <div className="h-1.5 dark:bg-gradient-to-r dark:from-primary dark:via-accent dark:to-purple-500 
          bg-gradient-to-r from-secondary via-primary to-accent"></div>
        <CardContent className="p-5">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Headphones className="h-5 w-5 dark:text-primary text-secondary-foreground" />
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
                            relative flex flex-col p-4 border rounded-lg cursor-pointer transition-all
                            ${format.color}
                            ${downloadOptions.audioFormat === format.value 
                              ? 'shadow-md' 
                              : 'dark:hover:border-primary/40 hover:border-secondary/50 hover:shadow-sm'
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
                                className="h-5 w-5 rounded-full dark:bg-primary bg-secondary flex items-center justify-center text-white"
                              >
                                <Check className="h-3 w-3" />
                              </motion.div>
                            )}
                          </div>
                          
                          <span className="text-xs dark:text-primary-foreground/70 text-secondary-foreground/70 mt-2">{format.description}</span>
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
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 dark:text-primary text-secondary-foreground" />
                  <h3 className="text-lg font-medium">Audio Quality</h3>
                </div>
                
                <div className="px-3 py-1 rounded-full dark:bg-primary/10 bg-secondary/10 
                  dark:text-primary-foreground text-secondary-foreground text-sm font-medium">
                  {getQualityLabel(downloadOptions.audioQuality)}
                </div>
              </div>
              
              <div className="px-2">
                <Select
                  value={downloadOptions.audioQuality}
                  onValueChange={(value) => updateDownloadOption("audioQuality", value)}
                >
                  <SelectTrigger className="w-full dark:border-primary/30 border-secondary/30">
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
                    <Volume2 className="h-6 w-6 dark:text-green-400 text-green-500" />
                    <span className="text-xs dark:text-primary-foreground/70 text-secondary-foreground/70 mt-1">Highest</span>
                  </div>
                  
                  <div className="hidden sm:block">
                    <span className="text-xs dark:text-primary-foreground/80 text-secondary-foreground/80 px-2 py-0.5 rounded-full 
                      dark:border-primary/20 border-secondary/20 border">
                      Value: {downloadOptions.audioQuality}
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <Volume2 className="h-4 w-4 dark:text-yellow-400 text-yellow-500" />
                    <span className="text-xs dark:text-primary-foreground/70 text-secondary-foreground/70 mt-1">Lowest</span>
                  </div>
                </div>
              </div>
              
              <div className="text-xs dark:text-primary-foreground/70 text-secondary-foreground/70 p-3 
                dark:bg-primary/5 bg-secondary/5 rounded-md dark:border-primary/20 border-secondary/20 border">
                <p className="flex items-center gap-1.5">
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