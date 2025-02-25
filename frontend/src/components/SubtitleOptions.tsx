import React, { useState } from 'react'
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Subtitles, Plus, X, Globe, Check } from "lucide-react"
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
    <Card className="border-primary/10">
      <CardHeader className="pb-3 bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Subtitles className="h-4 w-4" />
          Subtitle Options
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors">
            <div className="flex items-center space-x-3">
              <Globe className="h-4 w-4 text-primary" />
              <Label htmlFor="download-subtitles" className="cursor-pointer">Download subtitles</Label>
            </div>
            <Switch
              id="download-subtitles"
              checked={downloadOptions.downloadSubtitles}
              onCheckedChange={(value) => updateDownloadOption("downloadSubtitles", value)}
            />
          </div>
          
          {downloadOptions.downloadSubtitles && (
            <div className="space-y-4 pt-2 border-t">
              <div className="flex flex-col gap-2">
                <Label htmlFor="subtitle-languages" className="text-sm font-medium">
                  Selected Languages
                </Label>
                {downloadOptions.subtitleLanguages.length > 0 ? (
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1">
                    {downloadOptions.subtitleLanguages.map((lang) => {
                      const language = commonLanguages.find((l) => l.code === lang)
                      return (
                        <Badge key={lang} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                          {language?.name || lang}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 rounded-full hover:bg-destructive/20"
                            onClick={() => removeLanguage(lang)}
                          >
                            <X className="h-2 w-2" />
                          </Button>
                        </Badge>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground py-2 px-3 bg-muted/30 rounded-md">
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
                    className="h-9"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9" 
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
                <ScrollArea className="h-32 border rounded-md p-1">
                  <div className="grid grid-cols-2 gap-1 p-1">
                    {commonLanguages.map((lang) => {
                      const isSelected = downloadOptions.subtitleLanguages.includes(lang.code)
                      return (
                        <Button
                          key={lang.code}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className={`
                            justify-start text-xs h-8 px-2 
                            ${isSelected ? 'bg-primary' : 'hover:bg-accent'}
                          `}
                          onClick={() => isSelected ? removeLanguage(lang.code) : addLanguage(lang.code)}
                        >
                          {isSelected && <Check className="h-3 w-3 mr-1" />}
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
