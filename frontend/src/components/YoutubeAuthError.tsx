import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Info,
  Loader2,
  Cookie,
  KeyRound
} from "lucide-react";
import { FaChrome, FaFirefox, FaSafari, FaEdge } from "react-icons/fa";
import { API_BASE } from "@/types";

interface BrowserStatus {
  browser: string;
  is_available: boolean;
  message: string;
}

interface CookieStatus {
  browser_cookies_available: boolean;
  client_cookies_supported: boolean;
  message: string;
}

interface YoutubeAuthErrorProps {
  onRetry: () => void;
  error: string;
}

export function YoutubeAuthError({ onRetry, error }: YoutubeAuthErrorProps) {
  const [browserStatus, setBrowserStatus] = useState<BrowserStatus | null>(null);
  const [cookieStatus, setCookieStatus] = useState<CookieStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  // Check if this is a YouTube authentication error
  const isYoutubeAuthError = error.includes("Sign in to confirm you're not a bot") || 
                            error.includes("cookies") || 
                            error.includes("authentication");

  useEffect(() => {
    if (isYoutubeAuthError) {
      checkServerStatus();
    }
  }, [isYoutubeAuthError]);

  const checkServerStatus = async () => {
    setCheckingStatus(true);
    try {
      // Check both browser and cookie status
      const [browserResponse, cookieResponse] = await Promise.all([
        fetch(`${API_BASE}/browser_status`),
        fetch(`${API_BASE}/cookie_status`)
      ]);
      
      if (browserResponse.ok) {
        const data = await browserResponse.json();
        setBrowserStatus(data);
      }
      
      if (cookieResponse.ok) {
        const data = await cookieResponse.json();
        setCookieStatus(data);
      }
    } catch (error) {
      console.error("Error checking server status:", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Get browser icon based on browser name
  const getBrowserIcon = (browser: string) => {
    switch (browser?.toLowerCase()) {
      case 'chrome':
      case 'chromium':
      case 'brave':
      case 'vivaldi':
        return <FaChrome className="h-5 w-5" />;
      case 'firefox':
        return <FaFirefox className="h-5 w-5" />;
      case 'safari':
        return <FaSafari className="h-5 w-5" />;
      case 'edge':
        return <FaEdge className="h-5 w-5" />;
      default:
        return <FaChrome className="h-5 w-5" />;
    }
  };

  if (!isYoutubeAuthError) {
    return null;
  }

  return (
    <Card className="border-amber-500/30 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/10 mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <AlertCircle className="h-5 w-5" />
          YouTube Authentication Required
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-amber-700/90 dark:text-amber-400/90 mb-2">
          YouTube is asking for authentication to verify you're not a bot. This typically happens when:
        </p>
        <ul className="list-disc pl-5 text-sm text-amber-700/80 dark:text-amber-400/80 space-y-1 mb-4">
          <li>You're trying to access age-restricted content</li>
          <li>YouTube's anti-bot systems are triggered</li>
          <li>The content requires a signed-in account to access</li>
        </ul>
        
        {/* Server Browser Status */}
        {browserStatus && (
          <div className={`p-3 rounded-lg border ${
            browserStatus.is_available 
              ? 'bg-green-50 dark:bg-green-950/10 border-green-200 dark:border-green-800/30' 
              : 'bg-amber-50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800/30'
          } mb-3`}>
            <div className="flex items-center gap-2">
              {getBrowserIcon(browserStatus.browser)}
              <p className={`text-sm font-medium ${
                browserStatus.is_available 
                  ? 'text-green-700 dark:text-green-400' 
                  : 'text-amber-700 dark:text-amber-400'
              }`}>
                Server {browserStatus.browser.charAt(0).toUpperCase() + browserStatus.browser.slice(1)} 
                {browserStatus.is_available ? ' is available' : ' is not available'}
              </p>
            </div>
            <p className="text-xs mt-1 text-muted-foreground">
              {browserStatus.is_available 
                ? 'The server has a browser available for cookie extraction.' 
                : 'No server browser available. Client-side cookies will be used.'}
            </p>
          </div>
        )}

        {/* Client-Side Cookie Support Status */}
        {cookieStatus && (
          <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-800/30 mb-3">
            <div className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Client-side cookie extraction available
              </p>
            </div>
            <p className="text-xs mt-1 text-muted-foreground">
              {cookieStatus.browser_cookies_available 
                ? 'Both server browser and client-side cookies can be used for authentication.' 
                : 'Client-side cookie extraction is recommended since server browser is unavailable.'}
            </p>
          </div>
        )}
        
        {!browserStatus && !cookieStatus && (
          <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-950/10 mb-3 flex items-center gap-2">
            {checkingStatus ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                <p className="text-sm text-amber-700 dark:text-amber-400">Checking server status...</p>
              </>
            ) : (
              <>
                <Info className="h-5 w-5 text-amber-500" />
                <p className="text-sm text-amber-700 dark:text-amber-400">Server cookie status unknown</p>
              </>
            )}
          </div>
        )}
        
        <div className="text-sm text-amber-700/90 dark:text-amber-400/90">
          <p className="font-medium mb-1">What's happening?</p>
          <p className="mb-2">
            YouTube requires authentication cookies to verify you're not a bot. 
            {(cookieStatus?.client_cookies_supported && !browserStatus?.is_available) 
              ? " Our new client-side cookie extraction can help with this issue." 
              : " The server will try to use available browser cookies."}
          </p>
          
          <p className="font-medium mb-1">Recommended actions:</p>
          <ol className="list-decimal pl-5 text-sm text-amber-700/80 dark:text-amber-400/80 space-y-1">
            <li><span className="font-medium">Enable cookies in download options</span> - This will extract cookies from your browser</li>
            <li>Try a different video that doesn't require authentication</li>
            <li>Sign in to YouTube in your browser, then try again with cookie extraction enabled</li>
          </ol>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-amber-700 dark:text-amber-400 border-amber-500/30 dark:border-amber-500/50 hover:bg-amber-100/50 dark:hover:bg-amber-950/50"
          onClick={() => window.open("https://github.com/renbkna/renytdlp", "_blank")}
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          Learn More
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="text-amber-700 dark:text-amber-400 border-amber-500/30 dark:border-amber-500/50 hover:bg-amber-100/50 dark:hover:bg-amber-950/50"
            onClick={checkServerStatus}
            disabled={checkingStatus}
          >
            {checkingStatus ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Check Status
          </Button>
          
          <Button 
            variant="default" 
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800 text-white"
            onClick={onRetry}
          >
            <KeyRound className="h-4 w-4 mr-1" />
            Try With Auth
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}