#!/usr/bin/env node
import { CourseGradingClient } from './core/client';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  const getArg = (flag: string): string => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : '';
  };

  const cookie = getArg('--cookie') || process.env.NODD_COOKIE || '';
  const client = new CourseGradingClient({ sessionCookie: cookie });

  switch (command) {
    case 'list': {
      const threshold = parseInt(getArg('--threshold') || '72', 10);
      const list = await client.getPendingAssignments(threshold);
      console.log(JSON.stringify({ total: list.length, assignments: list }, null, 2));
      break;
    }

    case 'login': {
      const stid = getArg('--stid');
      const pwd = getArg('--pwd');
      if (!stid || !pwd) {
        console.error('用法: nodd login --stid <学号> --pwd <密码>');
        process.exit(1);
      }
      const res = await client.login(stid, pwd);
      console.log(JSON.stringify(res, null, 2));
      process.exit(res.success ? 0 : 1);
    }

    case 'detail': {
      const id = getArg('--id');
      if (!id) {
        console.error('用法: nodd detail --id <题目ID>');
        process.exit(1);
      }
      const detail = await client.getProblemDetail(id);
      console.log(JSON.stringify(detail, null, 2));
      break;
    }

    case 'eval': {
      const subs = await client.getLatestSubmissions();
      console.log(JSON.stringify(subs, null, 2));
      break;
    }

    case 'push': {
      const pushplus = getArg('--pushplus');
      const bark = getArg('--bark');
      const threshold = parseInt(getArg('--threshold') || '48', 10);
      const res = await client.triggerPushAlert({
        pushplusToken: pushplus,
        barkUrl: bark,
        hoursThreshold: threshold
      });
      console.log(JSON.stringify(res, null, 2));
      break;
    }

    case 'help':
    case '--help':
    case '-h':
    default:
      console.log(`
NoDDL - 武汉大学一体化平台工具包
---------------------------------------
命令列表:
  nodd list [--cookie "..."] [--threshold 72]      查询未完成作业与DDL
  nodd login --stid <学号> --pwd <密码>              测试自动加密登录
  nodd detail --id <题目ID> [--cookie "..."]        获取题目要求与样例
  nodd eval [--cookie "..."]                         查询最新判题结果
  nodd push [--pushplus "..."] [--bark "..."]       触发死线推送
      `);
      break;
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
