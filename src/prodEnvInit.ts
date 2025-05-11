import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

export function initProdEnv(): void {
  // 设置生产环境下的资源路径
  const appPath = app.getAppPath();
  const resourcesPath = path.join(appPath, '.webpack', 'renderer');
  const vsPath = path.join(resourcesPath, 'vs');
  
  // 检查资源目录
  if (!fs.existsSync(resourcesPath)) {
    console.warn(`Resources path does not exist: ${resourcesPath}`);
    return;
  }

  // 检查 Monaco 资源
  if (!fs.existsSync(vsPath)) {
    console.warn(`Monaco resources path does not exist: ${vsPath}`);
    return;
  }

  // 列出 Monaco 资源目录内容以帮助调试
  try {
    const files = fs.readdirSync(vsPath);
    console.log('Monaco resources directory contents:', files);
  } catch (err) {
    console.error('Failed to read Monaco resources directory:', err);
  }

  // 设置环境变量
  process.env.RESOURCES_PATH = resourcesPath;
  process.env.MONACO_PATH = vsPath;
  
  // 打印调试信息
  console.log('Production environment initialized');
  console.log('Resources path:', resourcesPath);
  console.log('Monaco path:', vsPath);
} 