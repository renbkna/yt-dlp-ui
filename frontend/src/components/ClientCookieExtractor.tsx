import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Cookie, 
  RefreshCw, 
  Info, 
  AlertCircle, 
  CheckCircle, 
  Shield
} from "lucide-react";
import { API_BASE } from "@/types";

// Define the cookie interface to match backend expectations
interface ClientCookie {
  domain: string;
  name: string;
  value: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  expirationDate?: number;
}

// Define the cookie status response from the API
interface CookieStatusResponse {
  browser_cookies_available: boolean;
  client_cookies_supported: boolean;
  cookie_file_path?: string;
  message: string;
}

export interface ClientCookieExtractorProps {
  cookiesEnabled: boolean;
  onCookiesChange: (enabled: boolean, cookies?: ClientCookie[]) => void;
}

export function ClientCookieExtractor({ cookiesEnabled, onCookiesChange }: ClientCookieExtractorProps) {
  const [extractedCookies, setExtractedCookies] = useState<ClientCookie[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cookieStatus, setCookieStatus] = useState<CookieStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Cookie domains to extract (focus on YouTube)
  const targetDomains = ['youtube.com', 'www.youtube.com', '.youtube.com', 'youtu.be', 'google.com', '.google.com'];
  
  // Cookie names to extract from YouTube
  const importantCookieNames = [
    'LOGIN_INFO',
    'SID',
    'HSID',
    'SSID',
    'APISID',
    'SAPISID',
    'CONSENT',
    '__Secure-1PSID',
    '__Secure-3PSID',
    '__Secure-1PAPISID',
    '__Secure-3PAPISID',
    'YSC',
    'VISITOR_INFO1_LIVE'
  ];
  
  // Check cookie status from the API
  useEffect(() => {
    async function checkCookieStatus() {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE}/cookie_status`);
        if (response.ok) {
          const data: CookieStatusResponse = await response.json();
          setCookieStatus(data);
        }
      } catch (err) {
        console.error("Failed to check cookie status:", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkCookieStatus();
  }, []);

  // Extract cookies automatically on component mount
  useEffect(() => {
    if (cookiesEnabled && extractedCookies.length === 0 && !extracting) {
      extractCookies();
    }
  }, [cookiesEnabled]);
  
  // Extract cookies from the user's browser
  const extractCookies = async () => {
    setExtracting(true);
    setError(null);
    try {
      // Create an empty array to hold extracted cookies
      const cookies: ClientCookie[] = [];
      
      // This is just for browser security reasons - we can only get non-HttpOnly cookies
      // from client-side JavaScript. For YouTube, many important cookies are not HttpOnly
      const currentCookies = document.cookie.split(';');
      
      for (const cookieStr of currentCookies) {
        try {
          const [name, value] = cookieStr.trim().split('=');
          if (name && value) {
            // Check if this is a YouTube related cookie
            const isYouTubeCookie = importantCookieNames.includes(name.trim()) || 
              targetDomains.some(domain => name.trim().includes(domain));
            
            if (isYouTubeCookie) {
              cookies.push({
                domain: 'youtube.com', // Default to youtube.com
                name: name.trim(),
                value: value,
                path: '/',
                secure: true,
                httpOnly: false
              });
            }
          }
        } catch (e) {
          console.warn("Failed to parse cookie:", cookieStr);
        }
      }
      
      // If we're on YouTube, try to extract more cookies using document.domain
      if (window.location.hostname.includes('youtube.com')) {
        cookies.push({
          domain: 'youtube.com',
          name: '_special_extracted_from_youtube',
          value: 'true',
          path: '/',
          secure: true,
          httpOnly: false
        });
      }
      
      // Update state with extracted cookies
      setExtractedCookies(cookies);
      
      // Notify parent component
      onCookiesChange(true, cookies);
      
      // Try to register cookies with the backend
      if (cookies.length > 0) {
        try {
          const response = await fetch(`${API_BASE}/cookies`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              cookies: cookies,
              source: 'client'
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
          }
          
          // Update cookie status after registration
          const data: CookieStatusResponse = await response.json();
          setCookieStatus(data);
        } catch (error) {
          console.error("Failed to register cookies with server:", error);
          setError("Failed to register cookies with the server. Your download will continue, but may not work for age-restricted content.");
        }
      } else {
        setError("No YouTube cookies found in your browser. This may affect downloads requiring authentication.");
      }
    } catch (err) {
      console.error("Error extracting cookies:", err);
      setError("Failed to extract cookies from your browser.");
    } finally {
      setExtracting(false);
    }
  };
  
  // Toggle cookies enabled
  const handleToggleCookies = (enabled: boolean) => {
    if (enabled && extractedCookies.length === 0) {
      // If enabling cookies and we don't have any yet, extract them
      extractCookies();
    } else {
      // Otherwise just update the parent component
      onCookiesChange(enabled, enabled ? extractedCookies : undefined);
    }
  };
  
  return (
    <Card className="dark:border-primary/20 border-secondary/30 shadow-sm mt-4">
      <CardHeader className="py-3 px-4 border-b dark:border-primary/20 border-secondary/20 dark:bg-primary/5 bg-secondary/10">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 dark:text-primary text-secondary-foreground" />
            <span>YouTube Authentication</span>
          </div>
          <Badge 
            variant="outline"
            className={`text-xs ${
              isLoading 
                ? "dark:bg-yellow-500/10 bg-yellow-500/10 dark:text-yellow-400 text-yellow-600" 
                : cookieStatus?.browser_cookies_available 
                  ? "dark:bg-green-500/10 bg-green-500/10 dark:text-green-400 text-green-600" 
                  : "dark:bg-blue-500/10 bg-blue-500/10 dark:text-blue-400 text-blue-600"
            }`}
          >
            {isLoading ? "Checking..." : cookieStatus?.browser_cookies_available ? "Server + Client Auth" : "Client Auth Only"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Status Alert */}
        {cookieStatus && (
          <Alert className={`dark:bg-blue-500/10 bg-blue-500/10 dark:text-blue-400 text-blue-600 
            dark:border-blue-500/30 border-blue-500/30 py-2 px-3`}>
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5" />
              <div>
                <AlertTitle className="mb-1 text-sm font-medium">
                  Cookie Authentication Status
                </AlertTitle>
                <AlertDescription className="text-xs">
                  {cookieStatus.browser_cookies_available
                    ? "The server has browser cookies available, but client cookies provide better compatibility."
                    : "Server browser cookies are not available. Client-side cookies will be used for authentication."}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Toggle switch */}
        <div className="flex items-center justify-between p-3 rounded-lg dark:hover:bg-primary/5 hover:bg-secondary/5 transition-colors
           dark:border-primary/20 border-secondary/20">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 rounded-full dark:bg-amber-500/10 bg-amber-500/10">
              <Cookie className="h-4 w-4 dark:text-amber-400 text-amber-500" />
            </div>
            <div>
              <Label htmlFor="client-cookies" className="cursor-pointer font-medium flex items-center">
                Use browser cookies
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 dark:text-primary-foreground/40 text-secondary-foreground/40 ml-1.5 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs dark:bg-background bg-white dark:border-primary/30 border-secondary/30">
                    <p>Extract cookies from your browser to authenticate with YouTube. Required for age-restricted content.</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <p className="text-xs dark:text-primary-foreground/60 text-secondary-foreground/60 mt-1">
                Access age-restricted content and signed-in features
              </p>
            </div>
          </div>
          <Switch
            id="client-cookies"
            checked={cookiesEnabled}
            onCheckedChange={handleToggleCookies}
            className="data-[state=checked]:dark:bg-amber-500 data-[state=checked]:bg-amber-500"
          />
        </div>
        
        {/* Cookie status information */}
        {cookiesEnabled && (
          <div className="p-3 rounded-lg dark:bg-primary/5 bg-secondary/5 text-sm">
            {extracting ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Extracting cookies from your browser...</span>
              </div>
            ) : extractedCookies.length > 0 ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 dark:text-green-400 text-green-500 flex-shrink-0" />
                <span>
                  <span className="font-medium">{extractedCookies.length} cookies extracted</span> from your browser for YouTube authentication.
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto h-7 px-2 dark:text-primary-foreground/70 text-secondary-foreground/70 
                    dark:hover:bg-primary/10 hover:bg-secondary/10 rounded-full"
                  onClick={extractCookies}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Refresh
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 dark:text-amber-400 text-amber-500 flex-shrink-0" />
                <span>Cookies are extracted automatically. Click refresh if needed.</span>
              </div>
            )}
            
            {error && (
              <div className="mt-2 text-xs dark:text-red-400 text-red-500 flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            {cookiesEnabled && !extracting && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 dark:border-primary/20 border-secondary/30 dark:text-primary-foreground 
                  text-secondary-foreground dark:hover:bg-primary/10 hover:bg-secondary/10"
                onClick={extractCookies}
                disabled={extracting}
              >
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Refresh Cookies
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}