// Background service worker for Ren YT-DLP Cookie Helper Extension
// This handles the actual cookie extraction

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getCookies') {
    getCookiesForDomain(message.domain)
      .then((cookies) => {
        sendResponse({
          success: true,
          cookies: cookies,
        });
      })
      .catch((error) => {
        sendResponse({
          success: false,
          error: error.message,
          cookies: [],
        });
      });

    // Return true to indicate we'll respond asynchronously
    return true;
  }
});

async function getCookiesForDomain(domain) {
  try {
    // Get all cookies for the domain
    const cookies = await chrome.cookies.getAll({
      domain: domain,
    });

    // Also get cookies for subdomains
    const subdomainCookies = await chrome.cookies.getAll({
      domain: `.${domain}`,
    });

    // Combine and deduplicate
    const allCookies = [...cookies, ...subdomainCookies];
    const uniqueCookies = allCookies.filter(
      (cookie, index, self) =>
        index ===
        self.findIndex(
          (c) => c.name === cookie.name && c.domain === cookie.domain
        )
    );

    // Convert to our format
    return uniqueCookies.map((cookie) => ({
      domain: cookie.domain,
      name: cookie.name,
      value: cookie.value,
      path: cookie.path,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      expirationDate: cookie.expirationDate,
    }));
  } catch (error) {
    console.error('Error getting cookies:', error);
    throw error;
  }
}
