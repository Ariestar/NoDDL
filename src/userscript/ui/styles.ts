export const PANEL_STYLES = `
:host {
  --primary: #3b82f6;
  --primary-hover: #2563eb;
  --bg-panel: rgba(255, 255, 255, 0.96);
  --bg-card: #f8fafc;
  --border: #e2e8f0;
  --text-main: #0f172a;
  --text-sub: #64748b;
  --danger: #ef4444;
  --warning: #f97316;
  --success: #10b981;
  --shadow: 0 12px 36px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  font-size: 14px;
  color: var(--text-main);
  box-sizing: border-box;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* 悬浮球 Trigger */
.nodd-trigger {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 999999;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: #ffffff;
  padding: 10px 18px;
  border-radius: 30px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.nodd-trigger:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.45);
}

.nodd-trigger .logo-badge {
  font-weight: 800;
  font-size: 13px;
  background: linear-gradient(90deg, #38bdf8, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.5px;
}

.nodd-trigger .counter {
  background: var(--danger);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 10px;
  margin-left: 2px;
}

/* 浮动主面板 */
.nodd-panel-wrapper {
  position: fixed;
  bottom: 80px;
  right: 24px;
  z-index: 999999;
  width: 440px;
  max-width: calc(100vw - 32px);
  max-height: 640px;
  height: 600px;
  background: var(--bg-panel);
  backdrop-filter: blur(16px);
  border-radius: 16px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: nodd-slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes nodd-slide-in {
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* 面板头部 */
.nodd-header {
  padding: 14px 18px;
  background: #ffffff;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nodd-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 15px;
}

.nodd-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-sub);
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 15px;
  transition: background 0.15s, color 0.15s;
}

.icon-btn:hover {
  background: var(--border);
  color: var(--text-main);
}

/* 导航 Tabs */
.nodd-tabs {
  display: flex;
  background: #f1f5f9;
  padding: 6px;
  gap: 4px;
  border-bottom: 1px solid var(--border);
}

.nodd-tab-item {
  flex: 1;
  text-align: center;
  padding: 7px 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-sub);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.nodd-tab-item.active {
  background: #ffffff;
  color: var(--primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* 容器内容区 */
.nodd-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 卡片样式 */
.nodd-card {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  transition: border-color 0.15s;
}

.nodd-card:hover {
  border-color: #cbd5e1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.card-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-main);
  line-height: 1.3;
}

.card-course {
  font-size: 12px;
  color: var(--text-sub);
}

/* 标签 Badge */
.badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
  white-space: nowrap;
}

.badge-critical { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
.badge-urgent { background: #ffedd5; color: #c2410c; border: 1px solid #fdba74; }
.badge-warning { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
.badge-normal { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }

/* 按钮规范 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-weight: 600;
  font-size: 13px;
  padding: 7px 14px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-primary {
  background: var(--primary);
  color: #fff;
}
.btn-primary:hover { background: var(--primary-hover); }

.btn-secondary {
  background: #f1f5f9;
  color: var(--text-main);
  border-color: var(--border);
}
.btn-secondary:hover { background: #e2e8f0; }

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

/* 表单组件 */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-sub);
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  font-size: 13px;
  background: #ffffff;
  color: var(--text-main);
  outline: none;
  transition: border-color 0.15s;
}

.form-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

/* 空状态与加载态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  color: var(--text-sub);
  text-align: center;
  gap: 8px;
}

.tutorial-link {
  font-size: 11px;
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.tutorial-link:hover {
  text-decoration: underline;
}

.tutorial-tip {
  font-size: 11px;
  color: var(--text-sub);
  line-height: 1.4;
  background: #f8fafc;
  padding: 6px 10px;
  border-radius: 6px;
  border-left: 3px solid var(--primary);
}

/* 顶部通知 Toast */
.nodd-toast {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: #0f172a;
  color: #ffffff;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  animation: nodd-fade 0.2s ease-out;
  z-index: 10;
}

@keyframes nodd-fade {
  from { opacity: 0; transform: translate(-50%, -6px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
`;
