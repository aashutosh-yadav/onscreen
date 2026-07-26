const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  const cursorPoint = screen.getCursorScreenPoint();

  mainWindow = new BrowserWindow({
    width: 600,
    height: 500,
    x: cursorPoint.x,
    y: cursorPoint.y,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#1e1e2e'
  });

  // Fixed: added else so it doesn't try to load both URLs
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
