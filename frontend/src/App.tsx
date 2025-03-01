import { useState, useEffect } from "react"
import YTDLP from "@/YTDLP"
import { Moon, Sun, Monitor, Github, Youtube, ChevronUp, Sparkles } from "lucide-react"
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
      <div className="min-h-screen flex flex-col bg-background text-foreground theme-transition scrollbar-thin">
        {/* Header */}
        <header className="sticky top-0 z-10 w-full backdrop-blur-md dark:bg-background/90 bg-background/80 shadow-md dark:shadow-primary/10 shadow-secondary/20">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full dark:bg-primary/20 bg-secondary/20 dark:shadow-glow shadow-md">
                <Youtube className="h-5 w-5 dark:text-primary text-secondary-foreground" />
              </div>
              <h1 className="text-xl font-extrabold tracking-tight dark:bg-gradient-to-r dark:from-primary dark:to-accent bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Ren YT-DLP
              </h1>
              <div className="hidden md:block ml-1">
                <span className="text-xs px-2 py-1 dark:bg-primary/10 bg-secondary/20 dark:text-primary-foreground text-secondary-foreground rounded-full">
                  <span className="hidden md:inline">Video Downloader</span>
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Theme Selector */}
              <div className="flex dark:bg-background/50 bg-white/70 backdrop-blur-sm rounded-full p-1 border dark:border-primary/30 border-secondary/30 shadow-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateTheme("light")}
                      className={`rounded-full h-8 w-8 ${theme === "light" ? "dark:bg-primary/20 bg-secondary/30 dark:text-primary text-secondary-foreground" : "text-muted-foreground"}`}
                    >
                      <Sun className="h-[1.2rem] w-[1.2rem]" />
                      <span className="sr-only">Light mode</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Light theme</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateTheme("dark")}
                      className={`rounded-full h-8 w-8 ${theme === "dark" ? "dark:bg-primary/20 bg-secondary/30 dark:text-primary text-secondary-foreground" : "text-muted-foreground"}`}
                    >
                      <Moon className="h-[1.2rem] w-[1.2rem]" />
                      <span className="sr-only">Dark mode</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Dark Theme</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateTheme("system")}
                      className={`rounded-full h-8 w-8 ${theme === "system" ? "dark:bg-primary/20 bg-secondary/30 dark:text-primary text-secondary-foreground" : "text-muted-foreground"}`}
                    >
                      <Monitor className="h-[1.2rem] w-[1.2rem]" />
                      <span className="sr-only">System theme</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">System preference</TooltipContent>
                </Tooltip>
              </div>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-full h-9 w-9 transition-all duration-300 dark:hover:text-primary hover:text-secondary-foreground
                    dark:border-primary/30 border-secondary/30 dark:hover:bg-primary/20 hover:bg-secondary/20
                    hover:scale-105 dark:shadow-primary/5 shadow-md" 
                    asChild
                  >
                    <a 
                      href="https://github.com/renbkna" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      aria-label="Visit GitHub profile"
                    >
                      <Github className="h-5 w-5" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">View on GitHub</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 container mx-auto px-4 py-8 relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
          <div className="dark:hidden absolute top-20 right-0 h-[30rem] w-[30rem] bg-secondary/30 rounded-full blur-3xl opacity-20 -z-10"></div>
          <div className="dark:hidden absolute bottom-20 left-0 h-[25rem] w-[25rem] bg-primary/30 rounded-full blur-3xl opacity-20 -z-10"></div>
          
          <div className="hidden dark:block absolute top-20 right-0 h-[30rem] w-[30rem] bg-primary/10 rounded-full blur-3xl opacity-10 -z-10"></div>
          <div className="hidden dark:block absolute bottom-20 left-0 h-[25rem] w-[25rem] bg-accent/10 rounded-full blur-3xl opacity-10 -z-10"></div>
          
          <YTDLP />
        </main>

        {/* Footer */}
        <footer className="w-full dark:bg-background/80 bg-background/90 backdrop-blur-md py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-y-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-full dark:bg-primary/10 bg-secondary/20">
                <Youtube className="h-4 w-4 dark:text-primary text-secondary-foreground" />
              </div>
              <span className="text-sm">
                Powered by <a 
                  href="https://github.com/yt-dlp/yt-dlp" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="dark:text-primary text-secondary-foreground hover:underline font-medium"
                >
                  yt-dlp
                </a>
              </span>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <span className="text-xs flex items-center gap-1">
                <Sparkles className="h-3 w-3 dark:text-primary/80 text-secondary-foreground/80" />
                <span className="dark:text-primary-foreground/80 text-secondary-foreground/80">
                  Supports YouTube, TikTok, Twitter & 
                  <a
                    href="https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dark:text-primary text-secondary-foreground hover:underline ml-1"
                  >
                    more
                  </a>
                </span>
              </span>
              
              <a
                href="https://github.com/renbkna/renytdlp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full 
                dark:bg-primary/10 bg-secondary/20 dark:text-primary-foreground text-secondary-foreground 
                dark:hover:bg-primary/20 hover:bg-secondary/30 transition-colors"
              >
                <Github className="h-3 w-3" /> renbkna/renytdlp
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
              className="fixed bottom-6 right-6 p-3 rounded-full dark:bg-primary bg-secondary text-white shadow-lg z-50 
              hover:scale-105 transition-transform dark:shadow-primary/30 shadow-secondary/30"
              aria-label="Scroll to top"
            >
              <ChevronUp className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>
        
        <Toaster />
      </div>
    </TooltipProvider>
  )
}

export default App