import { Calendar, Clock, Eye, User, ListVideo, Youtube } from "lucide-react" // Added Youtube import
// Removed unused Card and CardContent imports
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { VideoInfo } from "@/types"
import { motion } from "framer-motion"

interface VideoInfoHeaderProps {
  videoInfo: VideoInfo
}

export function VideoInfoHeader({ videoInfo }: VideoInfoHeaderProps) {
  // Format duration from seconds to MM:SS or HH:MM:SS
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "Unknown duration"
    
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // Format date from YYYYMMDD to a readable format
  const formatDate = (date?: string) => {
    if (!date || date.length !== 8) return "Unknown date"
    
    const year = date.substring(0, 4)
    const month = date.substring(4, 6)
    const day = date.substring(6, 8)
    
    return new Date(`${year}-${month}-${day}`).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  // Format view count with commas
  const formatViews = (views?: number) => {
    if (!views) return "Unknown views"
    return new Intl.NumberFormat().format(views)
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg overflow-hidden shadow-md border"
    >
      {videoInfo.is_playlist ? (
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-400/20 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <div className="relative shrink-0 w-full sm:w-48 h-32 rounded-lg overflow-hidden shadow-md bg-background/30 flex items-center justify-center">
              {videoInfo.thumbnail ? (
                <img 
                  src={videoInfo.thumbnail} 
                  alt={videoInfo.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ListVideo className="w-16 h-16 text-muted-foreground" />
              )}
              <Badge variant="secondary" className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm">
                <ListVideo className="w-3 h-3 mr-1" />
                Playlist
              </Badge>
            </div>
            <div className="flex-grow overflow-hidden">
              <h3 className="text-lg sm:text-xl font-bold line-clamp-2">{videoInfo.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                {videoInfo.entries?.length || 0} videos in playlist
              </p>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {videoInfo.entries?.slice(0, 3).map((entry, i) => (
                  <Badge key={i} variant="outline" className="bg-background/40 backdrop-blur-sm text-xs">
                    {entry.title.substring(0, 30)}{entry.title.length > 30 ? '...' : ''}
                  </Badge>
                ))}
                {(videoInfo.entries?.length || 0) > 3 && (
                  <Badge variant="outline" className="bg-background/40 backdrop-blur-sm text-xs">
                    +{(videoInfo.entries?.length || 0) - 3} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-red-600/20 to-orange-400/20">
          <div className="flex flex-col sm:flex-row">
            <div className="relative shrink-0 w-full sm:w-64 h-36 sm:h-auto">
              {videoInfo.thumbnail ? (
                <img 
                  src={videoInfo.thumbnail} 
                  alt={videoInfo.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Youtube className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
              
              {videoInfo.duration && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(videoInfo.duration)}
                </div>
              )}
            </div>
            <div className="p-4 sm:p-6 flex-grow">
              <h3 className="text-lg sm:text-xl font-bold line-clamp-2">{videoInfo.title}</h3>
              
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                {videoInfo.uploader && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate">{videoInfo.uploader}</span>
                  </div>
                )}
                
                {videoInfo.view_count !== undefined && (
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span>{formatViews(videoInfo.view_count)} views</span>
                  </div>
                )}
                
                {videoInfo.upload_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{formatDate(videoInfo.upload_date)}</span>
                  </div>
                )}
                
                {videoInfo.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{formatDuration(videoInfo.duration)}</span>
                  </div>
                )}
              </div>
              
              {videoInfo.description && (
                <div className="mt-4">
                  <Separator className="my-2" />
                  <div className="text-sm text-muted-foreground line-clamp-3 mt-2">
                    {videoInfo.description}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
