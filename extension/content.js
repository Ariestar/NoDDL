const SOURCE = 'nodd-session-bridge';

window.addEventListener('message', event => {
  if (event.source !== window || event.origin !== window.location.origin) return;
  const message = event.data;
  if (message?.source !== SOURCE || message.type !== 'get-session' || typeof message.requestId !== 'string') return;

  chrome.runtime.sendMessage({ type: 'nodd-get-session' }, response => {
    const error = chrome.runtime.lastError?.message || response?.error;
    window.postMessage({
      source: SOURCE,
      type: 'session-result',
      requestId: message.requestId,
      cookie: error ? undefined : response?.cookie,
      error
    }, window.location.origin);
  });
});
