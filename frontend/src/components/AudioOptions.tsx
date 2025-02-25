import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { DownloadOptions } from "@/types"
import { Music, Activity, Volume2 } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface AudioOptionsProps {
  downloadOptions: DownloadOptions
  updateDownloadOption: (key: keyof DownloadOptions, value: string | boolean | unknown) => void
}

export function AudioOptions({ downloadOptions, updateDownloadOption }: AudioOptionsProps) {
  const audioFormats = [
    { value: "mp3", label: "MP3", description: "Most compatible format" },
    { value: "m4a", label: "M4A", description: "Better quality than MP3" },
    { value: "opus", label: "Opus", description: "Best quality, less compatible" },
    { value: "wav", label: "WAV", description: "Lossless, very large files" },
    { value: "flac", label: "FLAC", description: "Lossless, compressed" },
    { value: "vorbis", label: "OGG Vorbis", description: "Open source format" },
  ]
  
  const audioQualities = [
    { value: "0", label: "Best Quality" },
    { value: "5", label: "Good Quality" },
    { value: "7", label: "Medium Quality" },
    { value: "9", label: "Low Quality" }
  ]
  
  return (
    <Card className="border border-primary/20 shadow-sm">
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Audio Format</h3>
            </div>
            
            <RadioGroup 
              value={downloadOptions.audioFormat}
              onValueChange={(value) => updateDownloadOption("audioFormat", value)}
              className="grid grid-cols-2 md:grid-cols-3 gap-3"
            >
              {audioFormats.map((format) => (
                <Label
                  key={format.value}
                  htmlFor={`format-${format.value}`}
                  className={`
                    flex flex-col p-4 border rounded-lg cursor-pointer transition-all
                    ${downloadOptions.audioFormat === format.value 
                      ? 'bg-primary/5 border-primary shadow-sm' 
                      : 'hover:bg-accent'
                    }
                  `}
                >
                  <RadioGroupItem 
                    value={format.value} 
                    id={`format-${format.value}`} 
                    className="sr-only" 
                  />
                  <span className="font-medium">{format.label}</span>
                  <span className="text-xs text-muted-foreground mt-1">{format.description}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Audio Quality</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <Select
                value={downloadOptions.audioQuality}
                onValueChange={(value) => updateDownloadOption("audioQuality", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  {audioQualities.map((quality) => (
                    <SelectItem key={quality.value} value={quality.value}>
                      {quality.label} {quality.value === "0" && "♪ (recommended)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Lower quality</span>
                </div>
                <span className="text-xs font-medium">
                  {audioQualities.find(q => q.value === downloadOptions.audioQuality)?.label}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Higher quality</span>
                  <Volume2 className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
