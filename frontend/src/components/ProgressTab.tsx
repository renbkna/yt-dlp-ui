import React from 'react'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertCircle } from "lucide-react"
import { DownloadStatus } from "@/types"

interface ProgressTabProps {
  downloadStatus: DownloadStatus | null
  resetForm: () => void
}

export const ProgressTab = ({ downloadStatus, resetForm }: ProgressTabProps) => (
  <div className="space-y-4">
    {downloadStatus && (
      <>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Download Progress</span>
            <span>{Math.round(downloadStatus.progress)}%</span>
          </div>
          <Progress value={downloadStatus.progress} />
        </div>
        
        {downloadStatus.filename && (
          <p className="text-sm text-muted-foreground">
            Current file: {downloadStatus.filename}
          </p>
        )}

        {downloadStatus.status === 'completed' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-md">
              <CheckCircle className="w-5 h-5" />
              <span>Download completed successfully!</span>
            </div>
            <Button 
              className="w-full"
              onClick={resetForm}
            >
              Download Another Video
            </Button>
          </div>
        )}

        {downloadStatus.status === 'error' && (
          <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {downloadStatus.error || 'An error occurred during download'}
          </div>
        )}
      </>
    )}
  </div>
)