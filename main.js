
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 400,
    frame: false, // 无边框
    transparent: true, // 透明背景
    alwaysOnTop: true, // 初始置顶
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // 加载本地入口
  win.loadFile('index.html');

  // 监听置顶状态切换请求
  ipcMain.on('set-always-on-top', (event, flag) => {
    win.setAlwaysOnTop(flag);
  });

  // 监听退出请求
  ipcMain.on('exit-app', () => {
    app.quit();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
