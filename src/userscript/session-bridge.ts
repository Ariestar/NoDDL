const BRIDGE_SOURCE = 'nodd-session-bridge';

export function readCourseSessionCookie(): Promise<string> {
  return new Promise((resolve, reject) => {
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const timeout = window.setTimeout(() => {
      window.removeEventListener('message', onMessage);
      reject(new Error('未连接 NoDDL Session Bridge 扩展'));
    }, 5000);

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const message = event.data;
      if (message?.source !== BRIDGE_SOURCE || message.type !== 'session-result' || message.requestId !== requestId) return;

      window.clearTimeout(timeout);
      window.removeEventListener('message', onMessage);
      if (typeof message.cookie === 'string' && message.cookie.length > 0) {
        resolve(message.cookie);
      } else {
        reject(new Error(typeof message.error === 'string' ? message.error : '扩展未返回课程平台会话'));
      }
    };

    window.addEventListener('message', onMessage);
    window.postMessage({ source: BRIDGE_SOURCE, type: 'get-session', requestId }, window.location.origin);
  });
}
