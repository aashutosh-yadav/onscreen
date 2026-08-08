const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow = null;

function showWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  const cursorPoint = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursorPoint);

  const windowWidth = 650;
  const windowHeight = 500;
  const x = Math.round(display.bounds.x + (display.bounds.width - windowWidth) / 2);
  const y = Math.round(display.bounds.y + display.bounds.height - windowHeight - 60);

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x,
    y,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#1e1e2e'
  });

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    const req = http.request({
      hostname: 'localhost',
      port: 8000,
      path: '/clear',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    req.end();
    mainWindow = null;
  });
}

function hideWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    // Tell backend to clear screenshot
    const req = http.request({
      hostname: 'localhost',
      port: 8000,
      path: '/clear',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    req.end();
    mainWindow.hide();
  }
}

// Small HTTP server inside Electron
// Python backend calls this to show the window
const electronServer = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/show') {
    console.log('Received show signal from backend');
    res.writeHead(200);
    res.end('ok');
    showWindow();
  } else {
    res.writeHead(404);
    res.end();
  }
});

electronServer.listen(8001, 'localhost', () => {
  console.log('Electron server listening on port 8001');
});

app.whenReady().then(() => {
  console.log('App ready — waiting for trigger from GNOME shortcut');
});

app.on('window-all-closed', () => {
  // Do not quit when window closes — keep running in background
});
