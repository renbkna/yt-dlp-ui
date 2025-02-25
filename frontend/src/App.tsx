import { useState, useEffect } from "react"
import YTDLP from "@/YTDLP"
import { Moon, Sun, Monitor, Github, Youtube, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

function App() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")

  useEffect(() => {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    const savedTheme = (localStorage.getItem("theme") as "light" | "dark" | "system") || "system"
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
    return () => mediaQuery.removeEventListener("change", handleChange)
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

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
        <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Youtube className="h-6 w-6 text-red-500" />
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">YT-DLP Web UI</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex gap-2 border rounded-full p-1 bg-muted/50">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateTheme("light")}
                      className={`rounded-full ${theme === "light" ? "bg-background text-primary shadow-sm" : ""}`}
                    >
                      <Sun className="h-[1.2rem] w-[1.2rem]" />
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
                      className={`rounded-full ${theme === "dark" ? "bg-background text-primary shadow-sm" : ""}`}
                    >
                      <Moon className="h-[1.2rem] w-[1.2rem]" />
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
                      className={`rounded-full ${theme === "system" ? "bg-background text-primary shadow-sm" : ""}`}
                    >
                      <Monitor className="h-[1.2rem] w-[1.2rem]" />
                      <span className="sr-only">System mode</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>System preference</TooltipContent>
                </Tooltip>
              </div>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full" asChild>
                    <a href="https://github.com/renbkna" target="_blank" rel="noopener noreferrer">
                      <Github className="h-[1.2rem] w-[1.2rem]" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View on GitHub</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8 relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
          <YTDLP />
        </main>

        <footer className="w-full border-t bg-muted/30 mt-auto backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">Powered by yt-dlp • Download videos safely and efficiently</p>
              <p className="mt-1">
                Supported platforms: YouTube, Vimeo, Twitter, TikTok, and{" "}
                <a
                  href="https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  many more
                </a>
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <p className="text-sm text-muted-foreground">Made with ❤️ by</p>
              <a
                href="https://github.com/renbkna"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Github className="h-3 w-3" /> renbkna
              </a>
            </div>
          </div>
        </footer>
        
        <Toaster />
      </div>
    </TooltipProvider>
  )
}

export default App

