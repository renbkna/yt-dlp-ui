import React from 'react'
import { VideoInfo } from '@/types'

export interface VideoInfoHeaderProps {
  videoInfo: VideoInfo
}

export const VideoInfoHeader: React.FC<VideoInfoHeaderProps> = React.memo(
  ({ videoInfo }) => {
    return (
      <div className="flex flex-col md:flex-row gap-4 pb-4 border-b">
        <img
          src={videoInfo.thumbnail}
          alt={videoInfo.title}
          className="w-full md:w-48 h-auto object-cover rounded"
        />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{videoInfo.title}</h3>
          <p className="text-sm text-muted-foreground">
            By {videoInfo.uploader || 'Unknown'} •{' '}
            {typeof videoInfo.view_count === 'number'
              ? `${videoInfo.view_count.toLocaleString()} views`
              : 'Views unavailable'}
          </p>
          <p className="text-sm text-muted-foreground">
            Upload date: {videoInfo.upload_date || 'Unknown'}
          </p>
        </div>
      </div>
    )
  }
)
VideoInfoHeader.displayName = 'VideoInfoHeader'
