import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DownloadStatus } from "@/types"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Download, 
  RefreshCw,
  File, 
  ArrowDownToLine,
  Clock,
  Music,
  Video,
  ListMusic
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
        return <CheckCircle className="h-10 w-10 text-green-500" />
      case "error":
        return <XCircle className="h-10 w-10 text-destructive" />
      case "downloading":
      case "processing":
        return <Loader2 className="h-10 w-10 text-violet-400 animate-spin" />
      default:
        return <Clock className="h-10 w-10 text-violet-400" />
    }
  }
  
  // Get file type icon based on filename
  const getFileTypeIcon = (filename?: string) => {
    if (!filename) return null;
    
    const isAudio = /\.(mp3|m4a|aac|flac|wav|opus|ogg)$/i.test(filename);
    const isPlaylist = filename.includes("Playlist:");
    
    if (isPlaylist) {
      return <ListMusic className="h-5 w-5 text-violet-400" />;
    } else if (isAudio) {
      return <Music className="h-5 w-5 text-violet-400" />;
    } else {
      return <Video className="h-5 w-5 text-violet-400" />;
    }
  }
  
  // Color for progress bar
  const getProgressColor = (status: string | undefined, progress: number) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "error":
        return "bg-destructive";
      default:
        // Create gradient based on progress
        if (progress < 30) return "bg-violet-500";
        if (progress < 70) return "bg-violet-600";
        return "bg-violet-700";
    }
  }
  
  if (!downloadStatus) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-violet-300">
        <Loader2 className="h-10 w-10 animate-spin mb-4 text-violet-400" />
        <p>Loading download status...</p>
      </div>
    )
  }
  
  const progress = Math.round(downloadStatus.progress * 100);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="relative">
        <AnimatePresence>
          {downloadStatus.status === "downloading" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -inset-1 bg-gradient-to-r from-violet-500/10 via-transparent to-violet-500/10 animate-pulse opacity-50 rounded-lg"
            />
          )}
        </AnimatePresence>
        
        <Card className={`border-2 ${downloadStatus.status === 'completed' ? 'border-green-500/30' : downloadStatus.status === 'error' ? 'border-destructive/30' : 'border-violet-500/30'} shadow-xl overflow-hidden rounded-xl bg-gradient-to-b from-black to-violet-950/20`}>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className={`${downloadStatus.status === 'completed' ? 'bg-green-500/10' : downloadStatus.status === 'error' ? 'bg-destructive/10' : 'bg-violet-500/10'} p-3 rounded-full`}
              >
                {getStatusIcon(downloadStatus.status)}
              </motion.div>
              
              <motion.h3
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`text-xl font-bold mt-4 ${downloadStatus.status === 'completed' ? 'text-green-500' : downloadStatus.status === 'error' ? 'text-destructive' : 'text-white'}`}
              >
                {getStatusDisplay(downloadStatus.status)}
              </motion.h3>
              
              {downloadStatus.filename && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/30"
                >
                  {getFileTypeIcon(downloadStatus.filename)}
                  <span className="text-sm font-medium text-violet-200">
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
                  <span className="text-sm font-medium flex items-center gap-1 text-violet-300">
                    <Clock className="h-3.5 w-3.5" />
                    {downloadStatus.status === "completed" ? 
                      "Download Complete" : 
                      downloadStatus.status === "error" ? 
                      "Download Failed" : 
                      "Download Progress"}
                  </span>
                  <motion.span 
                    key={progress}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-sm font-bold px-2 py-0.5 rounded-md ${
                      downloadStatus.status === "completed" ? 
                      "bg-green-500/10 text-green-500" : 
                      downloadStatus.status === "error" ? 
                      "bg-destructive/10 text-destructive" : 
                      "bg-violet-500/20 text-violet-300"
                    }`}
                  >
                    {progress}%
                  </motion.span>
                </div>
                
                <div className="h-3 w-full bg-violet-900/40 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ 
                      duration: 0.5,
                      ease: [0.34, 1.56, 0.64, 1]
                    }}
                    className={`h-full rounded-full ${getProgressColor(downloadStatus.status, progress)}`}
                  />
                </div>
              </motion.div>
            </div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-8 flex flex-col sm:flex-row gap-3 justify-center relative z-10"
            >
              {downloadStatus.status === "completed" ? (
                <Button 
                  className="w-full sm:w-auto flex-1 relative z-20 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg h-10 font-medium"
                  onClick={() => window.open("/downloads", "_blank")}
                  style={{ pointerEvents: 'auto' }}
                  data-testid="open-downloads-button"
                >
                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                  Open Downloads
                </Button>
              ) : downloadStatus.status === "error" ? (
                <Button 
                  variant="destructive"
                  className="w-full sm:w-auto flex-1 relative z-20 rounded-lg h-10 font-medium"
                  onClick={resetForm}
                  style={{ pointerEvents: 'auto' }}
                  data-testid="try-again-button"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              ) : null}
              
              <Button 
                variant={downloadStatus.status === "completed" ? "outline" : "default"}
                className={`w-full sm:w-auto flex-1 relative z-20 rounded-lg h-10 font-medium ${
                  downloadStatus.status === "completed" 
                    ? "border-green-500/50 text-green-400 hover:bg-green-500/10 hover:text-green-300" 
                    : "bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 shadow-md"
                }`}
                onClick={() => {
                  resetForm();
                }}
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                data-testid="download-another-button"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Another
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
          className="p-4 border border-destructive/50 bg-destructive/10 rounded-xl text-destructive"
        >
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium">Download Failed</h4>
              <p className="text-sm mt-1 whitespace-pre-wrap">{downloadStatus.error}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 h-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
                onClick={resetForm}
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Try Again
              </Button>
            </div>
          </div>
        </motion.div>
      )}
      
      {downloadStatus.status === "completed" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 border border-green-500/50 bg-green-500/5 rounded-xl flex items-start gap-3"
        >
          <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-500" />
          <div>
            <h4 className="font-medium text-green-400">Download Successful</h4>
            <p className="text-sm mt-1 text-green-300">
              Your file has been downloaded successfully. You can find it in the downloads folder.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}