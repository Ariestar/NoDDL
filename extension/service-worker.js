const PLATFORM_URL = 'http://115.156.107.145/';
const SESSION_COOKIE = 'educg_session';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'nodd-http') {
    const request = message.request;
    if (!request || !['GET', 'POST'].includes(request.method) || typeof request.url !== 'string') {
      sendResponse({ error: 'Invalid extension request' });
      return;
    }
    fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.method === 'POST' ? request.body : undefined
    }).then(async response => {
      sendResponse({ ok: response.ok, status: response.status, body: await response.text() });
    }).catch(error => {
      sendResponse({ error: error instanceof Error ? error.message : String(error) });
    });
    return true;
  }

  if (message?.type !== 'nodd-get-session') return;

  chrome.cookies.get({ url: PLATFORM_URL, name: SESSION_COOKIE }, cookie => {
    if (chrome.runtime.lastError) {
      sendResponse({ error: chrome.runtime.lastError.message });
      return;
    }
    if (!cookie?.value) {
      sendResponse({ error: `未找到 ${SESSION_COOKIE}` });
      return;
    }
    sendResponse({ cookie: `${SESSION_COOKIE}=${cookie.value}` });
  });

  return true;
});
