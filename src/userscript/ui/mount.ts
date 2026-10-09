import { render, h } from 'preact';
import { App } from './App';
import PANEL_STYLES from './panel.css?inline';
import { CourseGradingClient } from '../../core/client';
import { BrowserStorage } from '../browser-adapter';
import { Assignment, HttpClient } from '../../core/types';

export function mountNoDDLUI(
  client: CourseGradingClient,
  storage: BrowserStorage,
  initialAssignments: Assignment[],
  http: HttpClient
) {
  const HOST_ID = 'nodd-shadow-root';
  let hostEl = document.getElementById(HOST_ID);
  if (!hostEl) {
    hostEl = document.createElement('div');
    hostEl.id = HOST_ID;
    document.body.appendChild(hostEl);
  }

  // 挂载至隔离 Shadow DOM，杜绝与宿主页面 Bootstrap CSS 冲突
  const shadowRoot = hostEl.shadowRoot || hostEl.attachShadow({ mode: 'open' });

  // 注入面板隔离样式
  const styleEl = document.createElement('style');
  styleEl.textContent = PANEL_STYLES;
  shadowRoot.appendChild(styleEl);

  const mountContainer = document.createElement('div');
  shadowRoot.appendChild(mountContainer);

  render(h(App, { client, storage, initialAssignments, http }), mountContainer);
}
