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
      } catch {}
    }
  });
}
