// import { app, BrowserWindow, screen } from 'electron';
// import * as path from 'path';
//
// let mainWindow: BrowserWindow | null = null;
//
// function createWindow() {
//   // Get the current cursor position to satisfy our panel position design goal
//   const cursorPoint = screen.getCursorScreenPoint();
//
//   mainWindow = new BrowserWindow({
//     width: 600,             // Compact MVP panel width specification
//     height: 400,            // Dynamic growing container baseline
//     x: cursorPoint.x,       // Center near cursor position on trigger
//     y: cursorPoint.y,
//     frame: false,           // Frameless window container
//     alwaysOnTop: true,      // Ensures assistant sits nicely on top of all windows
//     resizable: true,
//     skipTaskbar: true,      // Keeps overlay lightweight and unlinked to taskbar utilities
//     webPreferences: {
//       nodeIntegration: false,
//       contextIsolation: true,
//       preload: path.join(__dirname, 'preload.js'), // Keep it ready for secure IPC communication later
//     },
//     backgroundColor: '#1e1e2e' // High contrast, comfortable dark styling base color
//   });
//
//   // Load from local Vite Development Port or local production distribution structure
//   if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
//     mainWindow.loadURL('http://localhost:5173');
//     // Optional: Open developer workspace window utilities for debugging
//     // mainWindow.webContents.openDevTools({ mode: 'detach' });
//   } else {
//     mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
//   }
//
//   mainWindow.on('closed', () => {
//     mainWindow = null;
//   });
// }
//
// app.whenReady().then(() => {
//   createWindow();
//
//   app.on('activate', () => {
//     if (BrowserWindow.getAllWindows().length === 0) createWindow();
//   });
// });
//
// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') app.quit();
// });
const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  const cursorPoint = screen.getCursorScreenPoint();

  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
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

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
  } {
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
