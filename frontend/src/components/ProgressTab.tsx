import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DownloadStatus } from "@/types"
import { motion } from "framer-motion"
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Download, 
  RefreshCw,
  File, 
  ArrowDownToLine,
  Clock
} from "lucide-react"

interface ProgressTabProps {
  downloadStatus: DownloadStatus | null
  resetForm: () => void
}

export function ProgressTab({ downloadStatus, resetForm }: ProgressTabProps) {
  // Format status for display
  const getStatusDisplay = (status: string | undefined) => {
    switch (status) {
      case "downloading":
        return "Downloading..."
      case "processing":
        return "Processing..."
      case "completed":
        return "Download Complete"
      case "error":
        return "Error"
      default:
        return "Initializing..."
    }
  }
  
  // Get icon based on current status
  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-8 w-8 text-green-500" />
      case "error":
        return <XCircle className="h-8 w-8 text-destructive" />
      case "downloading":
      case "processing":
        return <Loader2 className="h-8 w-8 text-primary animate-spin" />
      default:
        return <Clock className="h-8 w-8 text-muted-foreground" />
    }
  }
  
  // Color for progress bar
  const getProgressColor = (status: string | undefined) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "error":
        return "bg-destructive"
      default:
        return ""
    }
  }
  
  if (!downloadStatus) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin mb-4" />
        <p>Loading download status...</p>
      </div>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/5 via-transparent to-primary/5 animate-pulse opacity-50 rounded-md" />
        <Card className="border-2 shadow-lg overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {getStatusIcon(downloadStatus.status)}
              </motion.div>
              
              <motion.h3
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold mt-4"
              >
                {getStatusDisplay(downloadStatus.status)}
              </motion.h3>
              
              {downloadStatus.filename && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-2 flex items-center justify-center gap-2"
                >
                  <File className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {downloadStatus.filename}
                  </span>
                </motion.div>
              )}
              
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="w-full mt-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Progress
                  </span>
                  <span className="text-sm font-medium">
                    {Math.round(downloadStatus.progress * 100)}%
                  </span>
                </div>
                <Progress 
                  value={downloadStatus.progress * 100} 
                  className={`h-2 ${getProgressColor(downloadStatus.status)}`}
                />
              </motion.div>
            </div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
            >
              {downloadStatus.status === "completed" ? (
                <Button 
                  className="w-full sm:w-auto flex-1"
                  onClick={() => window.open("/downloads", "_blank")}
                >
                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                  Open Downloads Folder
                </Button>
              ) : downloadStatus.status === "error" ? (
                <Button 
                  variant="destructive"
                  className="w-full sm:w-auto flex-1"
                  onClick={resetForm}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              ) : null}
              
              <Button 
                variant="outline" 
                className="w-full sm:w-auto flex-1"
                onClick={resetForm}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Another Video
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </div>
      
      {downloadStatus.status === "error" && downloadStatus.error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 border border-destructive/50 bg-destructive/10 rounded-md text-destructive"
        >
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium">Download Failed</h4>
              <p className="text-sm mt-1 whitespace-pre-wrap">{downloadStatus.error}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
