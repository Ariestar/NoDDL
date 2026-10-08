import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/userscript/index.ts',
      userscript: {
        name: 'NoDDL (Not Only DDL) - 武大一体化平台助手',
        namespace: 'https://github.com/projectluojia/NoDDL',
        version: '1.0.0',
        description: '武汉大学人工智能学院一体化专业课平台 (115.156.107.145) 体验补完：死线警报、代码防丢、样例复制与 AI珞 联动',
        author: 'projectluojia',
        match: ['http://115.156.107.145/*'],
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
});
