
const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

// 优化 Windows 透明窗口性能
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 300,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false, // 防止窗口在后台时被限制性能
    },
  });

  win.loadFile('index.html');

  // 处理窗口大小动态调整
  ipcMain.on('resize-window', (event, { width, height }) => {
    if (win) {
      // 增加一点边距以容纳投影或控制面板
      const padding = 150; 
      win.setSize(Math.round(width + padding), Math.round(height + padding), true);
    }
  });

  ipcMain.on('set-always-on-top', (event, flag) => {
    win.setAlwaysOnTop(flag, 'screen-saver');
  });

  ipcMain.on('exit-app', () => {
    app.quit();
  });

  // 确保窗口在准备好后显示
  win.once('ready-to-show', () => {
    win.show();
    win.focus();
  });
}

// 解决某些 Windows 环境下防火墙或图形驱动导致的启动问题
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
