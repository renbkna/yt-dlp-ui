import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { API_BASE } from "@/types";
import { AlertCircle, CheckCircle, Wifi, WifiOff } from "lucide-react";

export function ApiDebug() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkApiConnection = async () => {
    setApiStatus('checking');
    setErrorMessage(null);
    
    try {
      // Extract the base URL without the /api suffix
      const baseUrl = API_BASE.replace(/\/api$/, '');
      
      console.log(`Attempting to connect to API: ${baseUrl}`);
      
      const response = await fetch(`${baseUrl}/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      console.log(`API response status: ${response.status}`);
      
      if (response.ok) {
        setApiStatus('connected');
      } else {
        setApiStatus('error');
        setErrorMessage(`API responded with status ${response.status}`);
      }
    } catch (error) {
      console.error('API connection error:', error);
      setApiStatus('error');
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  };

  useEffect(() => {
    checkApiConnection();
  }, []);

  return (
    <Card className="mb-4">
      <CardHeader className="py-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {apiStatus === 'checking' && <Wifi className="h-5 w-5 animate-pulse text-yellow-500" />}
          {apiStatus === 'connected' && <CheckCircle className="h-5 w-5 text-green-500" />}
          {apiStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
          API Connection Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span>Status:</span>
            {apiStatus === 'checking' && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/50">
                Checking...
              </Badge>
            )}
            {apiStatus === 'connected' && (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/50">
                Connected
              </Badge>
            )}
            {apiStatus === 'error' && (
              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/50">
                Error
              </Badge>
            )}
          </div>
          
          <div>
            <span>API URL:</span>
            <code className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{API_BASE}</code>
          </div>
          
          {errorMessage && (
            <div className="text-red-500 text-sm mt-2">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              {errorMessage}
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkApiConnection}
            className="mt-2"
          >
            {apiStatus === 'checking' ? (
              <>
                <Wifi className="mr-2 h-4 w-4 animate-pulse" />
                Checking...
              </>
            ) : (
              <>
                <WifiOff className="mr-2 h-4 w-4" />
                Test Connection
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}