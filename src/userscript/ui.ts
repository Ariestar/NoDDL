import { Assignment } from '../core/types';

/**
 * 顶部常驻死线倒计时横幅
 */
export function renderUrgentBanner(assignments: Assignment[], onConfigClick: () => void) {
  const existing = document.getElementById('nodd-banner-container');
  if (existing) existing.remove();

  if (assignments.length === 0) return;

  const mostUrgent = assignments[0];
  const isCritical = mostUrgent.urgency === 'critical';
  const bgColor = isCritical ? '#e53e3e' : '#dd6b20';

  const container = document.createElement('div');
  container.id = 'nodd-banner-container';
  container.style.cssText = `
    position: sticky;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 99999;
    background: ${bgColor};
    color: #ffffff;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.3s ease;
  `;

  const leftSpan = document.createElement('div');
  leftSpan.style.cssText = 'display:flex;align-items:center;gap:8px;font-weight:600;';
  leftSpan.innerHTML = `
    <span>${isCritical ? '🚨' : '⏳'} [NoDDL]</span>
    <span>【${mostUrgent.courseName}】${mostUrgent.title}</span>
    <span style="background:rgba(255,255,255,0.25);padding:2px 8px;border-radius:12px;font-size:12px;">
      ${mostUrgent.remainingText} (截止: ${mostUrgent.deadline})
    </span>
    ${assignments.length > 1 ? `<span style="font-size:12px;opacity:0.9;">等共 ${assignments.length} 项未交</span>` : ''}
  `;

  const rightActions = document.createElement('div');
  rightActions.style.cssText = 'display:flex;align-items:center;gap:8px;';

  const btnCopyCookie = document.createElement('button');
  btnCopyCookie.innerText = '📋 复制会话凭据';
  btnCopyCookie.style.cssText = 'background:#ffffff;color:#2d3748;border:none;border-radius:4px;padding:4px 10px;font-size:12px;cursor:pointer;font-weight:600;';
  btnCopyCookie.onclick = () => {
    const cookie = document.cookie;
    if (typeof GM_setClipboard !== 'undefined') {
      GM_setClipboard(cookie);
    } else {
      navigator.clipboard.writeText(cookie);
    }
    alert('已复制平台会话凭据 (Cookie) 到剪贴板！');
  };

  const btnSettings = document.createElement('button');
  btnSettings.innerText = '⚙️ 推送设置';
  btnSettings.style.cssText = 'background:rgba(255,255,255,0.2);color:#fff;border:1px solid rgba(255,255,255,0.4);border-radius:4px;padding:4px 8px;font-size:12px;cursor:pointer;';
  btnSettings.onclick = onConfigClick;

  const btnClose = document.createElement('button');
  btnClose.innerText = '✕';
  btnClose.style.cssText = 'background:none;border:none;color:#fff;font-size:16px;cursor:pointer;opacity:0.8;margin-left:8px;';
  btnClose.onclick = () => container.remove();

  rightActions.appendChild(btnCopyCookie);
  rightActions.appendChild(btnSettings);
  rightActions.appendChild(btnClose);

  container.appendChild(leftSpan);
  container.appendChild(rightActions);

  document.body.prepend(container);
}

/**
 * 题目页面样例输入/输出一键复制按钮
 */
export function setupTestCaseCopyButtons() {
  const codeBlocks = document.querySelectorAll('pre');
  if (codeBlocks.length === 0) return;

  codeBlocks.forEach((pre) => {
    if (pre.getAttribute('data-nodd-copy-injected')) return;
    pre.setAttribute('data-nodd-copy-injected', 'true');

    pre.style.position = 'relative';

    const copyBtn = document.createElement('button');
    copyBtn.innerText = '📋 复制样例';
    copyBtn.style.cssText = `
      position: absolute;
      top: 6px;
      right: 6px;
      background: rgba(49, 130, 206, 0.85);
      color: #ffffff;
      border: none;
      border-radius: 4px;
      font-size: 11px;
      padding: 2px 8px;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s;
    `;

    copyBtn.onmouseenter = () => (copyBtn.style.opacity = '1');
    copyBtn.onmouseleave = () => (copyBtn.style.opacity = '0.7');

    copyBtn.onclick = () => {
      const text = pre.innerText.replace('📋 复制样例', '').trim();
      if (typeof GM_setClipboard !== 'undefined') {
        GM_setClipboard(text);
      } else {
        navigator.clipboard.writeText(text);
      }
      copyBtn.innerText = '✅ 已复制';
      setTimeout(() => {
        copyBtn.innerText = '📋 复制样例';
      }, 1500);
    };

    pre.appendChild(copyBtn);
  });
}

/**
 * 代码编辑区域自动暂存与恢复机制
 */
export function setupCodeAutoSave() {
  const textareas = document.querySelectorAll('textarea');
  if (textareas.length === 0) return;

  const pathname = window.location.pathname;
  const search = window.location.search;
  const storageKey = `nodd_autosave_${pathname}_${search}`;

  textareas.forEach((area) => {
    let timer: any = null;
    area.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (area.value.trim().length > 0) {
          localStorage.setItem(storageKey, JSON.stringify({
            code: area.value,
            time: new Date().toLocaleString()
          }));
        }
      }, 2000);
    });

    const savedData = localStorage.getItem(storageKey);
    if (savedData && !area.getAttribute('data-nodd-restore-injected')) {
      area.setAttribute('data-nodd-restore-injected', 'true');
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.code && parsed.code !== area.value) {
          const restoreBtn = document.createElement('button');
          restoreBtn.innerText = `💾 恢复自动暂存代码 (${parsed.time})`;
          restoreBtn.type = 'button';
          restoreBtn.style.cssText = `
            margin: 6px 0;
            background: #319795;
            color: #ffffff;
            border: none;
            border-radius: 4px;
            padding: 4px 10px;
            font-size: 12px;
            cursor: pointer;
            font-weight: 500;
          `;
          restoreBtn.onclick = () => {
            if (confirm(`是否确认恢复于 ${parsed.time} 自动暂存的代码？`)) {
              area.value = parsed.code;
              area.dispatchEvent(new Event('input', { bubbles: true }));
              restoreBtn.remove();
            }
          };

          area.parentElement?.insertBefore(restoreBtn, area);
        }
      } catch {
        // ignore parse error
      }
    }
  });
}
