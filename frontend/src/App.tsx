import { useState, useEffect } from "react"
import YTDLP from "@/YTDLP"
import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"

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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">YT-DLP Web UI</h1>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => updateTheme("light")}
              className={`${theme === "light" ? "bg-accent text-accent-foreground" : ""}`}
            >
              <Sun className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Light mode</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => updateTheme("dark")}
              className={`${theme === "dark" ? "bg-accent text-accent-foreground" : ""}`}
            >
              <Moon className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Dark mode</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => updateTheme("system")}
              className={`${theme === "system" ? "bg-accent text-accent-foreground" : ""}`}
            >
              <Monitor className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">System mode</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <YTDLP />
      </main>

      <footer className="w-full border-t bg-muted/50 mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Powered by yt-dlp • Download videos safely and efficiently</p>
          <p className="mt-1">
            Supported platforms: YouTube, Vimeo, Twitter, TikTok, and{" "}
            <a
              href="https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              many more
            </a>
          </p>
          <p className="mt-2">
            Made by{" "}
            <a
              href="https://github.com/renbkna"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              renbkna
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App

