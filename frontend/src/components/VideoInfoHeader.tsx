import { Calendar, Clock, Eye, User, ListVideo, Youtube } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { VideoInfo } from "@/types"
import { motion } from "framer-motion"
import { formatDuration, formatDate, formatViews } from "@/lib/utils"

interface VideoInfoHeaderProps {
  videoInfo: VideoInfo
}

export function VideoInfoHeader({ videoInfo }: VideoInfoHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-lg overflow-hidden shadow-lg border border-violet-500/30"
    >
      {videoInfo.is_playlist ? (
        <div className="bg-violet-900/20 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative shrink-0 w-full sm:w-40 h-28 rounded-md overflow-hidden bg-black/50 flex items-center justify-center border border-violet-500/30">
              {videoInfo.thumbnail ? (
                <img 
                  src={videoInfo.thumbnail} 
                  alt={videoInfo.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ListVideo className="w-12 h-12 text-violet-400" />
              )}
              <Badge variant="secondary" className="absolute top-2 right-2 bg-violet-900/80 text-white">
                <ListVideo className="w-3 h-3 mr-1" />
                Playlist
              </Badge>
            </div>
            <div className="flex-grow overflow-hidden">
              <h3 className="text-lg font-medium line-clamp-2 text-white">{videoInfo.title}</h3>
              <p className="text-sm text-violet-300 mt-1">
                {videoInfo.entries?.length || 0} videos in playlist
              </p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {videoInfo.entries?.slice(0, 3).map((entry, i) => (
                  <Badge key={i} variant="outline" className="text-xs border-violet-500/30 bg-violet-900/20 text-violet-200">
                    {entry.title.substring(0, 25)}{entry.title.length > 25 ? '...' : ''}
                  </Badge>
                ))}
                {(videoInfo.entries?.length || 0) > 3 && (
                  <Badge variant="outline" className="text-xs border-violet-500/30 bg-violet-900/20 text-violet-200">
                    +{(videoInfo.entries?.length || 0) - 3} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-violet-900/20">
          <div className="flex flex-col sm:flex-row">
            <div className="relative shrink-0 w-full sm:w-56 h-32 sm:h-auto">
              {videoInfo.thumbnail ? (
                <img 
                  src={videoInfo.thumbnail} 
                  alt={videoInfo.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-violet-900/30 flex items-center justify-center">
                  <Youtube className="w-12 h-12 text-violet-400" />
                </div>
              )}
              
              {videoInfo.duration && (
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(videoInfo.duration)}
                </div>
              )}
            </div>
            <div className="p-4 flex-grow">
              <h3 className="text-lg font-medium line-clamp-2 text-white">{videoInfo.title}</h3>
              
              <div className="mt-3 grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                {videoInfo.uploader && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-violet-400" />
                    <span className="truncate text-violet-200">{videoInfo.uploader}</span>
                  </div>
                )}
                
                {videoInfo.view_count !== undefined && (
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-violet-400" />
                    <span className="text-violet-200">{formatViews(videoInfo.view_count)}</span>
                  </div>
                )}
                
                {videoInfo.upload_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-violet-400" />
                    <span className="text-violet-200">{formatDate(videoInfo.upload_date)}</span>
                  </div>
                )}
                
                {videoInfo.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-violet-400" />
                    <span className="text-violet-200">{formatDuration(videoInfo.duration)}</span>
                  </div>
                )}
              </div>
              
              {videoInfo.description && (
                <div className="mt-3">
                  <Separator className="my-2 bg-violet-500/30" />
                  <div className="text-sm text-violet-300 line-clamp-2 mt-1">
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