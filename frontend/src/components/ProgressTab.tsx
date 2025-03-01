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
  ArrowDownToLine,
  Clock,
  Music,
  Video,
  ListMusic,
  Wifi,
  AlertTriangle
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
        return "Processing Media..."
      case "completed":
        return "Download Complete"
      case "error":
        return "Download Failed"
      default:
        return "Initializing..."
    }
  }
  
  // Get icon based on current status
  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-12 w-12 dark:text-success text-success" />
      case "error":
        return <XCircle className="h-12 w-12 text-destructive" />
      case "downloading":
        return <Loader2 className="h-12 w-12 dark:text-primary text-secondary animate-spin" />
      case "processing":
        return <Loader2 className="h-12 w-12 dark:text-primary text-secondary animate-pulse" />
      default:
        return <Clock className="h-12 w-12 dark:text-primary-foreground/70 text-secondary-foreground/70" />
    }
  }
  
  // Get file type icon based on filename
  const getFileTypeIcon = (filename?: string) => {
    if (!filename) return null;
    
    const isAudio = /\.(mp3|m4a|aac|flac|wav|opus|ogg)$/i.test(filename);
    const isPlaylist = filename.includes("Playlist:");
    
    if (isPlaylist) {
      return <ListMusic className="h-5 w-5 dark:text-primary text-secondary-foreground" />;
    } else if (isAudio) {
      return <Music className="h-5 w-5 dark:text-primary text-secondary-foreground" />;
    } else {
      return <Video className="h-5 w-5 dark:text-primary text-secondary-foreground" />;
    }
  }
  
  // Color classes based on status
  const getStatusColorClasses = (status: string | undefined) => {
    switch (status) {
      case "completed":
        return {
          icon: "dark:bg-success/10 bg-success/10",
          text: "dark:text-success text-success",
          border: "dark:border-success/30 border-success/30",
          background: "dark:bg-success/5 bg-success/5",
          badge: "dark:bg-success/10 bg-success/10 dark:text-success text-success"
        };
      case "error":
        return {
          icon: "dark:bg-destructive/10 bg-destructive/10",
          text: "text-destructive",
          border: "border-destructive/30",
          background: "dark:bg-destructive/5 bg-destructive/5",
          badge: "dark:bg-destructive/10 bg-destructive/10 text-destructive"
        };
      case "downloading":
        return {
          icon: "dark:bg-primary/10 bg-secondary/10",
          text: "dark:text-primary-foreground text-secondary-foreground",
          border: "dark:border-primary/30 border-secondary/30",
          background: "dark:bg-primary/5 bg-secondary/5",
          badge: "dark:bg-primary/20 bg-secondary/20 dark:text-primary-foreground text-secondary-foreground"
        };
      case "processing":
        return {
          icon: "dark:bg-primary/10 bg-secondary/10",
          text: "dark:text-primary-foreground text-secondary-foreground",
          border: "dark:border-primary/30 border-secondary/30",
          background: "dark:bg-primary/5 bg-secondary/5",
          badge: "dark:bg-primary/20 bg-secondary/20 dark:text-primary-foreground text-secondary-foreground"
        };
      default:
        return {
          icon: "dark:bg-primary/10 bg-secondary/10",
          text: "dark:text-primary-foreground/70 text-secondary-foreground/70",
          border: "dark:border-primary/20 border-secondary/20",
          background: "dark:bg-primary/5 bg-secondary/5",
          badge: "dark:bg-primary/10 bg-secondary/10 dark:text-primary-foreground/70 text-secondary-foreground/70"
        };
    }
  };
  
  if (!downloadStatus) {
    return (
      <div className="flex flex-col items-center justify-center p-10 dark:text-primary-foreground/70 text-secondary-foreground/70">
        <Loader2 className="h-10 w-10 animate-spin mb-4 dark:text-primary text-secondary" />
        <p>Loading download status...</p>
      </div>
    )
  }
  
  const progress = Math.round(downloadStatus.progress * 100);
  const colorClasses = getStatusColorClasses(downloadStatus.status);
  
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
              className="absolute -inset-1 dark:bg-gradient-to-r dark:from-primary/10 dark:via-transparent dark:to-primary/10
                bg-gradient-to-r from-secondary/10 via-transparent to-secondary/10 animate-pulse opacity-50 rounded-lg"
            />
          )}
        </AnimatePresence>
        
        <Card className={`${downloadStatus.status === 'completed' ? 'dark:border-success/30 border-success/30' : 
          downloadStatus.status === 'error' ? 'border-destructive/30' : 
          'dark:border-primary/20 border-secondary/30'} shadow-xl overflow-hidden rounded-xl 
          dark:bg-card/60 bg-card/80 backdrop-blur-sm`}>
          <CardContent className="p-7">
            <div className="flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className={`${colorClasses.icon} p-4 rounded-full`}
              >
                {getStatusIcon(downloadStatus.status)}
              </motion.div>
              
              <motion.h3
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`text-xl font-bold mt-4 ${colorClasses.text}`}
              >
                {getStatusDisplay(downloadStatus.status)}
              </motion.h3>
              
              {downloadStatus.filename && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className={`mt-4 flex items-center justify-center gap-2.5 px-4 py-2 rounded-lg 
                    dark:bg-background/50 bg-white/50 ${colorClasses.border} border shadow-sm`}
                >
                  {getFileTypeIcon(downloadStatus.filename)}
                  <span className="text-sm font-medium dark:text-primary-foreground text-secondary-foreground">
                    {downloadStatus.filename}
                  </span>
                </motion.div>
              )}
              
              {downloadStatus.status === "downloading" && downloadStatus.speed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full dark:bg-primary/10 bg-secondary/10"
                >
                  <Wifi className="h-3.5 w-3.5 dark:text-primary text-secondary-foreground" />
                  <span className="text-xs dark:text-primary-foreground/80 text-secondary-foreground/80">
                    {downloadStatus.speed}{downloadStatus.eta ? ` • ${downloadStatus.eta}s remaining` : ''}
                  </span>
                </motion.div>
              )}
              
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="w-full mt-7"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-1.5 dark:text-primary-foreground/70 text-secondary-foreground/70">
                    <Clock className="h-3.5 w-3.5" />
                    {downloadStatus.status === "completed" ? 
                      "Download Complete" : 
                      downloadStatus.status === "error" ? 
                      "Download Failed" : downloadStatus.status === "processing" ?
                      "Processing Media" :
                      "Download Progress"}
                  </span>
                  <motion.span 
                    key={progress}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-xs font-bold px-2.5 py-1 rounded-md ${colorClasses.badge}`}
                  >
                    {progress}%
                  </motion.span>
                </div>
                
                <div className="h-3 w-full dark:bg-background/50 bg-white/50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ 
                      duration: 0.5,
                      ease: [0.34, 1.56, 0.64, 1]
                    }}
                    className={`h-full rounded-full ${
                      downloadStatus.status === "completed" ? 'dark:bg-success bg-success' : 
                      downloadStatus.status === "error" ? 'bg-destructive' : 
                      downloadStatus.status === "processing" ? 'dark:bg-accent bg-accent' :
                      'dark:bg-primary bg-secondary'
                    } ${downloadStatus.status === "downloading" ? 'animate-pulse' : ''}`}
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
                  className="w-full sm:w-auto flex-1 relative z-20 dark:bg-success bg-success hover:opacity-90 
                  transition-all duration-300 rounded-lg h-11 py-2.5 font-medium"
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
                  className="w-full sm:w-auto flex-1 relative z-20 rounded-lg h-11 py-2.5 font-medium"
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
                className={`w-full sm:w-auto flex-1 relative z-20 rounded-lg h-11 py-2.5 font-medium ${
                  downloadStatus.status === "completed" 
                    ? "dark:border-success/50 border-success/50 dark:text-success text-success dark:hover:bg-success/10 hover:bg-success/10" 
                    : "dark:bg-gradient-to-r dark:from-primary dark:to-accent/80 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all"
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
          className="p-4 border-destructive/50 border dark:bg-destructive/10 bg-destructive/5 rounded-xl text-destructive"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium">Error Details</h4>
              <p className="text-sm mt-1 whitespace-pre-wrap opacity-90">{downloadStatus.error}</p>
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
          className="p-4 dark:border-success/50 border-success/50 border dark:bg-success/5 bg-success/5 rounded-xl flex items-start gap-3"
        >
          <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 dark:text-success text-success" />
          <div>
            <h4 className="font-medium dark:text-success text-success">Download Complete</h4>
            <p className="text-sm mt-1 dark:text-success/80 text-success/80">
              Your file has been downloaded successfully. You can find it in the downloads folder.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}