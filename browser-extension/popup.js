// Popup script for the extension interface

document.addEventListener('DOMContentLoaded', function () {
  const extractBtn = document.getElementById('extractBtn');
  const status = document.getElementById('status');

  extractBtn.addEventListener('click', async function () {
    // Set loading state
    extractBtn.disabled = true;
    extractBtn.classList.add('loading');
    extractBtn.textContent = 'Extracting...';
    status.textContent = 'Extracting YouTube cookies...';
    status.className = 'status info loading';

    try {
      // Send message to background script to get cookies
      const response = await chrome.runtime.sendMessage({
        action: 'getCookies',
        domain: 'youtube.com',
      });

      if (response.success && response.cookies.length > 0) {
        // Copy cookies to clipboard as JSON
        const cookiesJson = JSON.stringify(response.cookies, null, 2);

        // Use the Clipboard API
        await navigator.clipboard.writeText(cookiesJson);

        // Success feedback
        status.innerHTML = `✅ Successfully extracted <span class="cookie-count">${response.cookies.length}</span> cookies and copied to clipboard!`;
        status.className = 'status success';
        extractBtn.textContent = '✓ Copied to Clipboard!';
        extractBtn.classList.remove('loading');

        // Show success message for 4 seconds
        setTimeout(() => {
          resetButton();
        }, 4000);
      } else {
        // No cookies found
        status.innerHTML =
          "⚠️ No YouTube cookies found.<br>Make sure you're logged into YouTube and try again.";
        status.className = 'status error';
        extractBtn.textContent = 'Try Again';
        extractBtn.classList.remove('loading');
        extractBtn.disabled = false;
      }
    } catch (error) {
      console.error('Error extracting cookies:', error);

      // Error feedback
      let errorMessage = 'Unknown error occurred';
      if (error.message.includes('clipboard')) {
        errorMessage = 'Failed to copy to clipboard. Please try again.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'Permission denied. Please check extension permissions.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      status.innerHTML = `❌ Error: ${errorMessage}`;
      status.className = 'status error';
      extractBtn.textContent = 'Try Again';
      extractBtn.classList.remove('loading');
      extractBtn.disabled = false;
    }
  });

  function resetButton() {
    extractBtn.disabled = false;
    extractBtn.classList.remove('loading');
    extractBtn.textContent = 'Extract YouTube Cookies';
    status.textContent = 'Click below to extract YouTube cookies';
    status.className = 'status info';
  }

  // Check if user is on YouTube and show relevant message
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentUrl = tabs[0].url;

    if (currentUrl && currentUrl.includes('youtube.com')) {
      status.innerHTML =
        "🎯 Perfect! You're on YouTube.<br>Ready for cookie extraction.";
      status.className = 'status success';
    } else if (
      currentUrl &&
      (currentUrl.includes('google.com') ||
        currentUrl.includes('accounts.google.com'))
    ) {
      status.innerHTML =
        "✅ You're on Google. YouTube cookies should be available.";
      status.className = 'status success';
    } else {
      status.innerHTML =
        "💡 For best results, visit <a href='https://youtube.com' target='_blank'>YouTube</a> first, then return here.";
      status.className = 'status info';
    }
  });
});
