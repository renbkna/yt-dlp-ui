// Content script for Ren YT-DLP Cookie Helper Extension
// This script communicates between the web app and the extension

// Listen for messages from the web app
window.addEventListener('message', async (event) => {
  // Only respond to our specific messages
  if (event.data?.type === 'YTDL_EXTENSION_CHECK') {
    // Respond that extension is available
    window.postMessage(
      {
        type: 'YTDL_EXTENSION_AVAILABLE',
        version: '1.0',
      },
      '*'
    );
  }

  if (event.data?.type === 'YTDL_GET_COOKIES' && event.data?.domain) {
    try {
      // Request cookies from background script
      const response = await chrome.runtime.sendMessage({
        action: 'getCookies',
        domain: event.data.domain,
      });

      // Send cookies back to web app
      window.postMessage(
        {
          type: 'YTDL_COOKIES_RESPONSE',
          cookies: response.cookies || [],
          success: response.success,
        },
        '*'
      );
    } catch (error) {
      console.error('Failed to get cookies:', error);
      window.postMessage(
        {
          type: 'YTDL_COOKIES_RESPONSE',
          cookies: [],
          success: false,
          error: error.message,
        },
        '*'
      );
    }
  }
});

// Notify that extension is loaded
console.log('Ren YT-DLP Cookie Helper Extension loaded');
