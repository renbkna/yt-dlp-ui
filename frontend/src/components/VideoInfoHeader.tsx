import { Calendar, Clock, Eye, User, ListVideo, Youtube, Play, Sparkles } from "lucide-react"
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
      className="rounded-xl overflow-hidden shadow-lg dark:border border-primary/30 border-secondary/30"
    >
      {videoInfo.is_playlist ? (
        <div className="dark:bg-primary/5 bg-secondary/10">
          <div className="flex flex-col sm:flex-row gap-4 p-4">
            <div className="relative shrink-0 w-full sm:w-40 h-28 rounded-lg overflow-hidden dark:bg-background/50 bg-white/30 
              flex items-center justify-center dark:border border-primary/30 border-secondary/30">
              {videoInfo.thumbnail ? (
                <img 
                  src={videoInfo.thumbnail} 
                  alt={videoInfo.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ListVideo className="w-12 h-12 dark:text-primary text-secondary-foreground" />
              )}
              <div className="absolute top-2 right-2 px-2 py-1 rounded-md dark:bg-primary/50 bg-secondary/70 
                dark:text-white text-white text-xs font-medium flex items-center gap-1">
                <ListVideo className="w-3 h-3" />
                Playlist
              </div>
            </div>
            <div className="flex-grow overflow-hidden">
              <h3 className="text-lg font-semibold line-clamp-2">{videoInfo.title}</h3>
              <p className="text-sm dark:text-primary-foreground/80 text-secondary-foreground/80 mt-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 dark:text-primary text-secondary-foreground" />
                {videoInfo.entries?.length || 0} videos in playlist
              </p>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {videoInfo.entries?.slice(0, 3).map((entry, i) => (
                  <Badge key={i} variant="outline" className="text-xs dark:border-primary/30 border-secondary/30 
                    dark:bg-primary/10 bg-secondary/10 dark:text-primary-foreground text-secondary-foreground">
                    {entry.title.substring(0, 25)}{entry.title.length > 25 ? '...' : ''}
                  </Badge>
                ))}
                {(videoInfo.entries?.length || 0) > 3 && (
                  <Badge variant="outline" className="text-xs dark:border-primary/30 border-secondary/30 
                    dark:bg-primary/10 bg-secondary/10 dark:text-primary-foreground text-secondary-foreground">
                    +{(videoInfo.entries?.length || 0) - 3} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="dark:bg-primary/5 bg-secondary/10">
          <div className="flex flex-col sm:flex-row">
            <div className="relative shrink-0 w-full sm:w-56 h-32 sm:h-auto overflow-hidden">
              {videoInfo.thumbnail ? (
                <div className="relative group w-full h-full">
                  <img 
                    src={videoInfo.thumbnail} 
                    alt={videoInfo.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 
                    bg-black/30 transition-opacity duration-300">
                    <div className="w-12 h-12 rounded-full dark:bg-primary/80 bg-secondary/80 flex items-center justify-center">
                      <Play className="w-5 h-5 text-white ml-1" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full dark:bg-background/50 bg-white/30 flex items-center justify-center dark:border-r border-primary/20">
                  <Youtube className="w-12 h-12 dark:text-primary text-secondary-foreground" />
                </div>
              )}
              
              {videoInfo.duration && (
                <div className="absolute bottom-2 right-2 dark:bg-background/90 bg-black/70 text-white text-xs px-2 py-1 rounded-md">
                  {formatDuration(videoInfo.duration)}
                </div>
              )}
            </div>
            <div className="p-5 flex-grow">
              <h3 className="text-lg font-medium line-clamp-2">{videoInfo.title}</h3>
              
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-sm">
                {videoInfo.uploader && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 dark:text-primary text-secondary-foreground" />
                    <span className="truncate dark:text-primary-foreground/90 text-secondary-foreground/90">{videoInfo.uploader}</span>
                  </div>
                )}
                
                {videoInfo.view_count !== undefined && (
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 dark:text-primary text-secondary-foreground" />
                    <span className="dark:text-primary-foreground/90 text-secondary-foreground/90">{formatViews(videoInfo.view_count)}</span>
                  </div>
                )}
                
                {videoInfo.upload_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 dark:text-primary text-secondary-foreground" />
                    <span className="dark:text-primary-foreground/90 text-secondary-foreground/90">{formatDate(videoInfo.upload_date)}</span>
                  </div>
                )}
                
                {videoInfo.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 dark:text-primary text-secondary-foreground" />
                    <span className="dark:text-primary-foreground/90 text-secondary-foreground/90">{formatDuration(videoInfo.duration)}</span>
                  </div>
                )}
              </div>
              
              {videoInfo.description && (
                <div className="mt-4">
                  <Separator className="my-3 dark:bg-primary/20 bg-secondary/20" />
                  <div className="text-sm dark:text-primary-foreground/80 text-secondary-foreground/80 line-clamp-2 mt-1">
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