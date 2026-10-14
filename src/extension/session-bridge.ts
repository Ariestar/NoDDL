export function readCourseSessionCookie(): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'nodd-get-session' }, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (typeof response?.cookie === 'string' && response.cookie.length > 0) {
        resolve(response.cookie);
        return;
      }
      reject(new Error(typeof response?.error === 'string' ? response.error : '扩展未返回课程平台会话'));
    });
  });
}
