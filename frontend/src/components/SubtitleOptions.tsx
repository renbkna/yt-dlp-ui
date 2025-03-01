import { useState } from 'react'
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Subtitles, Plus, X, Globe, Check, Languages } from "lucide-react"
import { DownloadOptions } from "@/types"
import { ScrollArea } from "@/components/ui/scroll-area"

interface LanguageOption {
  code: string
  name: string
}

interface SubtitleOptionsProps {
  downloadOptions: DownloadOptions
  updateDownloadOption: (key: keyof DownloadOptions, value: unknown) => void
}

export function SubtitleOptions({ downloadOptions, updateDownloadOption }: SubtitleOptionsProps) {
  const [newLanguage, setNewLanguage] = useState("")
  
  // Common language options
  const commonLanguages: LanguageOption[] = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh", name: "Chinese" },
    { code: "ru", name: "Russian" },
    { code: "ar", name: "Arabic" },
    { code: "pt", name: "Portuguese" },
    { code: "hi", name: "Hindi" },
  ]
  
  const addLanguage = (code: string) => {
    if (!downloadOptions.subtitleLanguages.includes(code)) {
      updateDownloadOption("subtitleLanguages", [...downloadOptions.subtitleLanguages, code])
    }
    setNewLanguage("")
  }
  
  const removeLanguage = (code: string) => {
    updateDownloadOption(
      "subtitleLanguages", 
      downloadOptions.subtitleLanguages.filter((lang) => lang !== code)
    )
  }
  
  return (
    <Card className="dark:border-primary/20 border-secondary/30 rounded-xl shadow-sm overflow-hidden">
      <CardHeader className="pb-3 dark:bg-primary/5 bg-secondary/10 border-b dark:border-primary/20 border-secondary/20">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Subtitles className="h-4 w-4 dark:text-primary text-secondary-foreground" />
          Subtitle Options
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg dark:hover:bg-primary/5 hover:bg-secondary/5 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 rounded-full dark:bg-primary/10 bg-secondary/10">
                <Globe className="h-4 w-4 dark:text-primary text-secondary-foreground" />
              </div>
              <div>
                <Label htmlFor="download-subtitles" className="cursor-pointer font-medium">Download subtitles</Label>
                <p className="text-xs dark:text-primary-foreground/60 text-secondary-foreground/60 mt-1">
                  Download available subtitles for the video
                </p>
              </div>
            </div>
            <Switch
              id="download-subtitles"
              checked={downloadOptions.downloadSubtitles}
              onCheckedChange={(value) => updateDownloadOption("downloadSubtitles", value)}
              className="data-[state=checked]:dark:bg-primary data-[state=checked]:bg-secondary"
            />
          </div>
          
          {downloadOptions.downloadSubtitles && (
            <div className="space-y-4 pt-3 dark:border-t border-t dark:border-primary/10 border-secondary/10">
              <div className="flex flex-col gap-2">
                <Label htmlFor="subtitle-languages" className="text-sm font-medium flex items-center gap-1.5">
                  <Languages className="h-4 w-4 dark:text-primary text-secondary-foreground" />
                  Selected Languages
                </Label>
                {downloadOptions.subtitleLanguages.length > 0 ? (
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1">
                    {downloadOptions.subtitleLanguages.map((lang) => {
                      const language = commonLanguages.find((l) => l.code === lang)
                      return (
                        <Badge key={lang} variant="secondary" 
                          className="pl-2.5 pr-1 py-1 flex items-center gap-1.5 dark:bg-primary/10 bg-secondary/10 
                            dark:text-primary-foreground text-secondary-foreground dark:border-primary/20 border-secondary/20">
                          {language?.name || lang}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 rounded-full dark:hover:bg-destructive/20 hover:bg-destructive/20"
                            onClick={() => removeLanguage(lang)}
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </Badge>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-sm dark:text-primary-foreground/70 text-secondary-foreground/70 py-2 px-3 
                    dark:bg-primary/5 bg-secondary/5 rounded-md dark:border border-primary/20 border-secondary/20">
                    No languages selected. Default is "en".
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="add-subtitle-language" className="text-sm font-medium">
                  Add Language (ISO 639-1 code)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="add-subtitle-language"
                    placeholder="e.g. en, fr, de"
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    className="h-9 dark:border-primary/30 border-secondary/30"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 dark:border-primary/30 border-secondary/30 dark:text-primary-foreground text-secondary-foreground
                      dark:hover:bg-primary/20 hover:bg-secondary/20" 
                    onClick={() => newLanguage && addLanguage(newLanguage)}
                    disabled={!newLanguage}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Common Languages
                </Label>
                <ScrollArea className="h-32 dark:border border dark:border-primary/20 border-secondary/20 rounded-md p-1">
                  <div className="grid grid-cols-2 gap-1 p-1">
                    {commonLanguages.map((lang) => {
                      const isSelected = downloadOptions.subtitleLanguages.includes(lang.code)
                      return (
                        <Button
                          key={lang.code}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className={`justify-start text-xs h-8 px-2 ${isSelected ? 
                            'dark:bg-primary bg-secondary dark:text-white text-white' : 
                            'dark:border-primary/30 border-secondary/30 dark:hover:bg-primary/20 hover:bg-secondary/20'}`}
                          onClick={() => isSelected ? removeLanguage(lang.code) : addLanguage(lang.code)}
                        >
                          {isSelected && <Check className="h-3 w-3 mr-1.5" />}
                          {lang.name} ({lang.code})
                        </Button>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}