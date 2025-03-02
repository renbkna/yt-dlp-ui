import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Info,
  Loader2,
} from "lucide-react";
import { FaChrome, FaFirefox, FaSafari, FaEdge } from "react-icons/fa";
import { API_BASE } from "@/types";

interface BrowserStatus {
  browser: string;
  is_available: boolean;
  message: string;
}

interface YoutubeAuthErrorProps {
  onRetry: () => void;
  error: string;
}

export function YoutubeAuthError({ onRetry, error }: YoutubeAuthErrorProps) {
  const [browserStatus, setBrowserStatus] = useState<BrowserStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  // Check if this is a YouTube authentication error
  const isYoutubeAuthError = error.includes("Sign in to confirm you're not a bot") || 
                            error.includes("cookies") || 
                            error.includes("authentication");

  useEffect(() => {
    if (isYoutubeAuthError) {
      checkBrowserStatus();
    }
  }, [isYoutubeAuthError]);

  const checkBrowserStatus = async () => {
    setCheckingStatus(true);
    try {
      const response = await fetch(`${API_BASE}/browser_status`);
      if (response.ok) {
        const data = await response.json();
        setBrowserStatus(data);
      } else {
        console.error("Failed to check browser status:", await response.text());
      }
    } catch (error) {
      console.error("Error checking browser status:", error);
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
        
        {browserStatus ? (
          <div className={`p-3 rounded-lg border ${
            browserStatus.is_available 
              ? 'bg-green-50 dark:bg-green-950/10 border-green-200 dark:border-green-800/30' 
              : 'bg-red-50 dark:bg-red-950/10 border-red-200 dark:border-red-800/30'
          } mb-3`}>
            <div className="flex items-center gap-2">
              {getBrowserIcon(browserStatus.browser)}
              <p className={`text-sm font-medium ${
                browserStatus.is_available 
                  ? 'text-green-700 dark:text-green-400' 
                  : 'text-red-700 dark:text-red-400'
              }`}>
                {browserStatus.browser.charAt(0).toUpperCase() + browserStatus.browser.slice(1)} 
                {browserStatus.is_available ? ' is available' : ' is not available'}
              </p>
            </div>
            <p className="text-xs mt-1 text-muted-foreground">
              {browserStatus.is_available 
                ? 'The server will use browser cookies for authentication.' 
                : 'The server does not have browser cookies available.'}
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-950/10 mb-3 flex items-center gap-2">
            {checkingStatus ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                <p className="text-sm text-amber-700 dark:text-amber-400">Checking browser availability...</p>
              </>
            ) : (
              <>
                <Info className="h-5 w-5 text-amber-500" />
                <p className="text-sm text-amber-700 dark:text-amber-400">Browser status unknown</p>
              </>
            )}
          </div>
        )}
        
        <div className="text-sm text-amber-700/90 dark:text-amber-400/90">
          <p className="font-medium mb-1">What's happening?</p>
          <p className="mb-2">
            The server tries to use browser cookies to authenticate with YouTube.
            {browserStatus?.is_available 
              ? " Browser cookies are available, but may need to be refreshed." 
              : " However, the necessary browser is not available on the server."}
          </p>
          
          <p className="font-medium mb-1">Possible solutions:</p>
          <ol className="list-decimal pl-5 text-sm text-amber-700/80 dark:text-amber-400/80 space-y-1">
            <li>Try again - sometimes temporary issues resolve themselves</li>
            <li>Try a different video that doesn't require authentication</li>
            <li>Contact the server administrator to ensure proper browser setup</li>
          </ol>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-amber-700 dark:text-amber-400 border-amber-500/30 dark:border-amber-500/50 hover:bg-amber-100/50 dark:hover:bg-amber-950/50"
          onClick={() => window.open("https://github.com/yt-dlp/yt-dlp/wiki/FAQ#how-do-i-pass-cookies-to-yt-dlp", "_blank")}
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          Learn More
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="text-amber-700 dark:text-amber-400 border-amber-500/30 dark:border-amber-500/50 hover:bg-amber-100/50 dark:hover:bg-amber-950/50"
            onClick={checkBrowserStatus}
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
            <RefreshCw className="h-4 w-4 mr-1" />
            Try Again
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}