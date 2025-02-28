import { useState, useEffect } from "react"
import YTDLP from "@/YTDLP"
import { Moon, Sun, Monitor, Github, Youtube, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AnimatePresence, motion } from "framer-motion"

function App() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark") // Default to dark
  const [scrollToTop, setScrollToTop] = useState(false)

  useEffect(() => {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    const savedTheme = (localStorage.getItem("theme") as "light" | "dark" | "system") || "dark"
    setTheme(savedTheme)

    if (savedTheme === "system") {
      document.documentElement.classList.toggle("dark", systemTheme === "dark")
    } else {
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        document.documentElement.classList.toggle("dark", e.matches)
      }
    }
    mediaQuery.addEventListener("change", handleChange)
    
    // Scroll-to-top button logic
    const handleScroll = () => {
      setScrollToTop(window.scrollY > 300)
    }
    window.addEventListener("scroll", handleScroll)
    
    return () => {
      mediaQuery.removeEventListener("change", handleChange)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [theme])

  const updateTheme = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)

    if (newTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      document.documentElement.classList.toggle("dark", systemTheme)
    } else {
      document.documentElement.classList.toggle("dark", newTheme === "dark")
    }
  }

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-black text-foreground theme-transition">
        {/* Header */}
        <header className="sticky top-0 z-10 w-full border-b border-violet-500/30 bg-background/90 backdrop-blur-lg">
          <div className="container mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-violet-500/20">
                <Youtube className="h-5 w-5 text-violet-400" />
              </div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                Ren YT-DLP
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex gap-1 border border-violet-500/30 rounded-full p-1 bg-violet-900/20 shadow-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateTheme("light")}
                      className={`rounded-full h-7 w-7 ${theme === "light" ? "bg-background text-violet-400" : "text-gray-400"}`}
                    >
                      <Sun className="h-4 w-4" />
                      <span className="sr-only">Light mode</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Light mode</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateTheme("dark")}
                      className={`rounded-full h-7 w-7 ${theme === "dark" ? "bg-background text-violet-400" : "text-gray-400"}`}
                    >
                      <Moon className="h-4 w-4" />
                      <span className="sr-only">Dark mode</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Dark mode</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateTheme("system")}
                      className={`rounded-full h-7 w-7 ${theme === "system" ? "bg-background text-violet-400" : "text-gray-400"}`}
                    >
                      <Monitor className="h-4 w-4" />
                      <span className="sr-only">System mode</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>System preference</TooltipContent>
                </Tooltip>
              </div>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-full h-8 w-8 transition-transform hover:scale-105 border-violet-500/30 text-violet-300 hover:bg-violet-900/30" 
                    asChild
                  >
                    <a 
                      href="https://github.com/renbkna" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      aria-label="Visit GitHub profile"
                    >
                      <Github className="h-4 w-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View on GitHub</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 container mx-auto px-4 py-6 relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-15 pointer-events-none"></div>
          <YTDLP />
        </main>

        {/* Footer - Simplified */}
        <footer className="w-full border-t border-violet-500/30 bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-y-2">
            <div className="text-sm text-violet-300 flex items-center gap-2">
              <div className="p-1 rounded-md bg-violet-500/20">
                <Youtube className="h-3.5 w-3.5 text-violet-400" />
              </div>
              <span>
                Powered by <a href="https://github.com/yt-dlp/yt-dlp" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 hover:underline">yt-dlp</a>
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-xs text-violet-400">
                Supports YouTube, Vimeo, Twitter, TikTok, and 
                <a
                  href="https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-300 hover:underline ml-1"
                >
                  many more
                </a>
              </span>
              <a
                href="https://github.com/renbkna"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors"
              >
                <Github className="h-3 w-3" /> renbkna
              </a>
            </div>
          </div>
        </footer>
        
        {/* Scroll-to-top button */}
        <AnimatePresence>
          {scrollToTop && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={handleScrollToTop}
              className="fixed bottom-6 right-6 p-2 rounded-full bg-violet-600 text-white shadow-lg z-50 hover:scale-110 transition-transform"
              aria-label="Scroll to top"
            >
              <ChevronUp className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>
        
        <Toaster />
      </div>
    </TooltipProvider>
  )
}

export default App