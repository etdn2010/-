
const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const win = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // 初始设置：允许鼠标穿透（这样启动时不会挡住屏幕中心）
  win.setIgnoreMouseEvents(true, { forward: true });

  win.loadFile('index.html');

  // 处理置顶切换
  ipcMain.on('set-always-on-top', (event, flag) => {
    win.setAlwaysOnTop(flag, 'screen-saver');
  });

  // 处理鼠标穿透切换：当鼠标进入摄像头区域时关闭穿透，离开时开启
  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.setIgnoreMouseEvents(ignore, options);
  });

  ipcMain.on('exit-app', () => {
    app.quit();
  });

  // 开发时可以使用此项调试
  // win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
