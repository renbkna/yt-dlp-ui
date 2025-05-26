import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import {
  Cookie,
  RefreshCw,
  Info,
  AlertCircle,
  CheckCircle,
  Upload,
  Key,
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

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

export interface ClientCookieExtractorProps {
  cookiesEnabled: boolean;
  onCookiesChange: (enabled: boolean, cookies?: ClientCookie[]) => void;
}

export function ClientCookieExtractor({
  cookiesEnabled,
  onCookiesChange,
}: ClientCookieExtractorProps) {
  const [extractedCookies, setExtractedCookies] = useState<ClientCookie[]>([]);
  const [extensionAvailable, setExtensionAvailable] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [cookieText, setCookieText] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for browser extension on component mount
  useEffect(() => {
    let isComponentMounted = true;

    const checkExtension = () => {
      // Check if our companion extension is available
      if (typeof window !== 'undefined' && window.postMessage) {
        window.postMessage({ type: 'YTDL_EXTENSION_CHECK' }, '*');

        // Listen for response
        const handleExtensionResponse = (event: MessageEvent) => {
          if (
            event.data?.type === 'YTDL_EXTENSION_AVAILABLE' &&
            isComponentMounted
          ) {
            setExtensionAvailable(true);
            window.removeEventListener('message', handleExtensionResponse);
          }
        };

        window.addEventListener('message', handleExtensionResponse);

        // Clean up listener after 1 second
        const timeoutId = setTimeout(() => {
          window.removeEventListener('message', handleExtensionResponse);
        }, 1000);

        // Return cleanup function
        return () => {
          window.removeEventListener('message', handleExtensionResponse);
          clearTimeout(timeoutId);
        };
      }
    };

    const cleanup = checkExtension();

    // Cleanup function
    return () => {
      isComponentMounted = false;
      if (cleanup) cleanup();
    };
  }, []);

  // Extract cookies automatically on component mount
  useEffect(() => {
    if (cookiesEnabled && extractedCookies.length === 0) {
      // We no longer do automatic extraction - user must use extension or manual input
    }
  }, [cookiesEnabled, extractedCookies.length]);

  // Note: Old automatic cookie extraction removed - it was broken due to browser security

  // Extract cookies via browser extension
  const extractCookiesViaExtension = async () => {
    if (!extensionAvailable) {
      setError(
        'Browser extension not available. Please install the Ren YT-DLP Cookie Helper extension.'
      );
      return;
    }

    setError(null);

    try {
      // Request cookies from extension
      window.postMessage(
        {
          type: 'YTDL_GET_COOKIES',
          domain: 'youtube.com',
        },
        '*'
      );

      // Wait for cookies response
      const cookies = await new Promise<ClientCookie[]>((resolve, reject) => {
        const handleCookieResponse = (event: MessageEvent) => {
          if (event.data?.type === 'YTDL_COOKIES_RESPONSE') {
            window.removeEventListener('message', handleCookieResponse);
            if (event.data.success) {
              resolve(event.data.cookies || []);
            } else {
              reject(
                new Error(event.data.error || 'Failed to extract cookies')
              );
            }
          }
        };

        window.addEventListener('message', handleCookieResponse);

        // Timeout after 5 seconds
        setTimeout(() => {
          window.removeEventListener('message', handleCookieResponse);
          reject(new Error('Extension did not respond'));
        }, 5000);
      });

      setExtractedCookies(cookies);
      onCookiesChange(true, cookies);
    } catch (err) {
      console.error('Cookie extraction failed:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to extract cookies'
      );
    }
  };

  // Import cookies from manual input
  const importCookies = async () => {
    if (!cookieText.trim()) {
      setError('Please paste your cookies');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const cookies: ClientCookie[] = [];

      // Try to parse as JSON first (from browser extensions)
      try {
        const jsonCookies = JSON.parse(cookieText);
        if (Array.isArray(jsonCookies)) {
          for (const cookie of jsonCookies) {
            if (
              cookie.name &&
              cookie.value &&
              cookie.domain?.includes('youtube')
            ) {
              cookies.push({
                domain: cookie.domain,
                name: cookie.name,
                value: cookie.value,
                path: cookie.path || '/',
                secure: cookie.secure !== false,
                httpOnly: cookie.httpOnly || false,
                expirationDate: cookie.expirationDate,
              });
            }
          }
        }
      } catch {
        // If JSON parsing fails, try Netscape format
        const lines = cookieText.split('\n');
        for (const line of lines) {
          if (line.trim() && !line.startsWith('#')) {
            const parts = line.split('\t');
            if (parts.length >= 7) {
              cookies.push({
                domain: parts[0],
                name: parts[5],
                value: parts[6],
                path: parts[2],
                secure: parts[3] === 'TRUE',
                httpOnly: false,
                expirationDate: parseInt(parts[4]) || undefined,
              });
            }
          }
        }
      }

      if (cookies.length === 0) {
        throw new Error('No valid YouTube cookies found in the provided text');
      }

      setExtractedCookies(cookies);
      onCookiesChange(true, cookies);
      setShowManualInput(false);
      setCookieText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import cookies');
    } finally {
      setImporting(false);
    }
  };

  // Toggle cookies enabled
  const handleToggleCookies = (enabled: boolean) => {
    // Update the parent component
    onCookiesChange(enabled, enabled ? extractedCookies : undefined);
  };

  return (
    <div className="space-y-4">
      {/* Main Cookie Authentication Card */}
      <div
        className="flex items-center justify-between p-3 rounded-lg dark:hover:bg-primary/5 hover:bg-secondary/5 transition-colors
        dark:border-primary/20 border-secondary/20"
      >
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded-full dark:bg-orange-500/10 bg-orange-500/10">
            <Cookie className="h-4 w-4 dark:text-orange-400 text-orange-500" />
          </div>
          <div>
            <Label
              htmlFor="cookie-auth"
              className="cursor-pointer font-medium flex items-center"
            >
              YouTube Authentication
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 dark:text-primary-foreground/40 text-secondary-foreground/40 ml-1.5 cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-xs dark:bg-background bg-white dark:border-primary/30 border-secondary/30"
                >
                  <p>
                    Required for age-restricted content, private videos, and
                    some high-quality formats.
                  </p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <p className="text-xs dark:text-primary-foreground/60 text-secondary-foreground/60 mt-1">
              {extractedCookies.length > 0
                ? `${extractedCookies.length} YouTube cookies loaded`
                : 'Enable to download age-restricted content'}
            </p>
          </div>
        </div>
        <Switch
          id="cookie-auth"
          checked={cookiesEnabled}
          onCheckedChange={handleToggleCookies}
          className="data-[state=checked]:dark:bg-orange-500 data-[state=checked]:bg-orange-500"
        />
      </div>

      {/* Cookie Setup Methods */}
      <AnimatePresence>
        {cookiesEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="dark:border-orange-500/20 border-orange-500/30 dark:bg-orange-500/5 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Key className="h-4 w-4" />
                  Choose Cookie Setup Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Method 1: Browser Extension (Recommended) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={extensionAvailable ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {extensionAvailable ? '✅ Available' : '❌ Not Installed'}
                    </Badge>
                    <span className="text-sm font-medium">
                      Browser Extension (Recommended)
                    </span>
                  </div>

                  {extensionAvailable ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Extension detected! Click below to automatically extract
                        your YouTube cookies.
                      </p>
                      <Button
                        onClick={extractCookiesViaExtension}
                        className="w-full"
                        variant="default"
                      >
                        <Cookie className="w-4 h-4 mr-2" />
                        Extract Cookies Automatically
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Extension Required</AlertTitle>
                        <AlertDescription className="text-xs">
                          For automatic cookie extraction, install our browser
                          extension:
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          <strong>Option 1:</strong> Get our extension from{' '}
                          <a
                            href="https://github.com/renbkna/yt-dlp-ui"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          >
                            GitHub repo
                          </a>
                          :
                        </p>
                        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                          <p>1. Download/clone the repo</p>
                          <p>
                            2. Open <code>chrome://extensions/</code>
                          </p>
                          <p>3. Enable "Developer mode"</p>
                          <p>4. Click "Load unpacked"</p>
                          <p>
                            5. Select the <code>browser-extension/</code> folder
                          </p>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          <strong>Option 2:</strong> Use any cookie extraction
                          extension (Cookie-Editor, Get cookies.txt LOCALLY,
                          etc.) + manual import below
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Method 2: Manual Input */}
                <div className="pt-3 border-t dark:border-primary/20 border-secondary/20">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Manual Cookie Input
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowManualInput(!showManualInput)}
                      >
                        {showManualInput ? 'Hide' : 'Show'} Manual Input
                      </Button>
                    </div>

                    <AnimatePresence>
                      {showManualInput && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3"
                        >
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>
                              How to get cookies manually:
                            </AlertTitle>
                            <AlertDescription className="text-xs space-y-1">
                              <p>
                                1. Install a cookie exporter extension (like
                                "Cookie-Editor")
                              </p>
                              <p>2. Go to YouTube.com and log in</p>
                              <p>3. Export cookies as JSON and paste below</p>
                            </AlertDescription>
                          </Alert>

                          <Textarea
                            placeholder="Paste your YouTube cookies here (JSON format)..."
                            value={cookieText}
                            onChange={(
                              e: React.ChangeEvent<HTMLTextAreaElement>
                            ) => setCookieText(e.target.value)}
                            className="min-h-24 text-xs font-mono"
                          />

                          <Button
                            onClick={importCookies}
                            disabled={importing || !cookieText.trim()}
                            className="w-full"
                            variant="secondary"
                          >
                            {importing ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Importing...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Import Cookies
                              </>
                            )}
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Success Display */}
                {extractedCookies.length > 0 && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Cookies Loaded Successfully!</AlertTitle>
                    <AlertDescription className="text-xs">
                      {extractedCookies.length} YouTube authentication cookies
                      are now available for downloads.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
