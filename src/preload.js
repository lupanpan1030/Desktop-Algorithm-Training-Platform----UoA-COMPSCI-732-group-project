// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

// 添加Monaco编辑器资源路径处理
const isPackaged = process.env.NODE_ENV === 'production';
console.log('Preload script - 运行环境:', isPackaged ? '生产环境' : '开发环境');

// 检查Monaco资源是否存在
function checkMonacoResources() {
  try {
    if (isPackaged) {
      const appPath = path.dirname(process.execPath);
      const vsPath = path.join(appPath, 'resources', 'app', '.webpack', 'renderer', 'vs');
      const exists = fs.existsSync(vsPath);
      console.log('Monaco resources path:', vsPath, exists ? '存在' : '不存在');
      return exists;
    }
    return true;
  } catch (error) {
    console.error('检查Monaco资源时出错:', error);
    return false;
  }
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => {
    // whitelist channels
    const validChannels = ['toMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    const validChannels = ['fromMain'];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  // 添加Monaco相关API
  monaco: {
    resourcesAvailable: checkMonacoResources(),
    isPackaged: isPackaged
  }
});
