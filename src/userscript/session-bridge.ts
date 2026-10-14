const BRIDGE_SOURCE = 'nodd-session-bridge';
const pageWindow = unsafeWindow;

export function readCourseSessionCookie(): Promise<string> {
  return new Promise((resolve, reject) => {
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const timeout = window.setTimeout(() => {
      pageWindow.removeEventListener('message', onMessage);
      reject(new Error('未连接 NoDDL Session Bridge 扩展'));
    }, 5000);

    const onMessage = (event: MessageEvent) => {
      if (event.source !== pageWindow || event.origin !== pageWindow.location.origin) return;
      const message = event.data;
      if (message?.source !== BRIDGE_SOURCE || message.type !== 'session-result' || message.requestId !== requestId) return;

      window.clearTimeout(timeout);
      pageWindow.removeEventListener('message', onMessage);
      if (typeof message.cookie === 'string' && message.cookie.length > 0) {
        resolve(message.cookie);
      } else {
        reject(new Error(typeof message.error === 'string' ? message.error : '扩展未返回课程平台会话'));
      }
    };

    pageWindow.addEventListener('message', onMessage);
    pageWindow.postMessage({ source: BRIDGE_SOURCE, type: 'get-session', requestId }, pageWindow.location.origin);
  });
}
