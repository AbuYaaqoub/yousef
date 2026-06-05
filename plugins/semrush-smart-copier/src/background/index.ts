// src/background/index.ts
// Naqeeb Smart Copier - Background Service Worker
// Proxies fetch requests to bypass CORS and CSP restrictions on HTTPS sites.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FETCH_API') {
    const { url, options } = message;
    
    fetch(url, options)
      .then(async (res) => {
        const text = await res.text();
        let data = {};
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = { text }; // Fallback if response is not JSON
        }
        return {
          status: res.status,
          ok: res.ok,
          data
        };
      })
      .then((result) => {
        sendResponse({ success: true, result });
      })
      .catch((error) => {
        console.error('[Naqeeb Smart Copier Background Error]', error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep the message channel open for async sendResponse
  }
});
