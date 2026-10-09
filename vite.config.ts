import { defineConfig, loadEnv } from 'vite';
import monkey from 'vite-plugin-monkey';
import preact from '@preact/preset-vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiHost = env.VITE_EMAIL_API_BASE_URL
    ? new URL(env.VITE_EMAIL_API_BASE_URL).hostname
    : 'localhost';

  return {
    plugins: [
      preact(),
      monkey({
        entry: 'src/userscript/index.ts',
        userscript: {
          name: 'NoDDL (Not Only DDL) - 武大一体化平台助手',
          namespace: 'https://github.com/projectluojia/NoDDL',
          version: '1.0.0',
          description: '武汉大学人工智能学院一体化专业课平台 (115.156.107.145) 体验补完：死线警报、代码防丢、样例复制与 AI珞 联动',
          author: 'projectluojia',
          match: ['http://115.156.107.145/*'],
          connect: [apiHost],
          grant: [
            'GM_xmlhttpRequest',
            'GM_notification',
            'GM_setValue',
            'GM_getValue',
            'GM_setClipboard'
          ],
          runAt: 'document-end'
        },
        build: {
          fileName: 'nodd-l.user.js'
        }
      })
    ],
    build: {
      emptyOutDir: false
    }
  };
});
