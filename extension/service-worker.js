const PLATFORM_URL = 'http://115.156.107.145/';
const SESSION_COOKIE = 'educg_session';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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
