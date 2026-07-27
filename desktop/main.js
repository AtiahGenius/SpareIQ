import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initLocalDatabase, queryLocalDatabase } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 420,
    minHeight: 600,
    title: 'SpareIQ — Inventory & Sales Management',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';
  const prodPath = path.join(__dirname, '../frontend/dist/index.html');

  if (process.env.NODE_ENV === 'development' || !fs.existsSync(prodPath)) {
    console.log(`💻 Desktop App running in Dev mode -> Loading ${devUrl}`);
    mainWindow.loadURL(devUrl).catch(() => {
      console.log('Retrying dev URL connection...');
      setTimeout(() => mainWindow.loadURL(devUrl), 2000);
    });
  } else {
    console.log(`💻 Desktop App running in Production mode -> Loading ${prodPath}`);
    mainWindow.loadFile(prodPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App Lifecycle
app.whenReady().then(() => {
  const userDataPath = app.getPath('userData');
  initLocalDatabase(userDataPath);

  // Photo dir
  const photoDir = path.join(userDataPath, 'Receipts');
  if (!fs.existsSync(photoDir)) {
    fs.mkdirSync(photoDir, { recursive: true });
  }

  // Register IPC Handlers
  ipcMain.handle('app:get-info', () => {
    return {
      appName: 'SpareIQ Desktop',
      version: app.getVersion(),
      platform: process.platform,
      userDataPath: app.getPath('userData')
    };
  });

  ipcMain.handle('db:query', async (event, { sql, params }) => {
    try {
      return await queryLocalDatabase(sql, params || []);
    } catch (err) {
      console.error('IPC DB Query Error:', err);
      throw err;
    }
  });

  ipcMain.handle('file:save-receipt-photo', async (event, { arrayBuffer, filename }) => {
    try {
      const photoDir = path.join(app.getPath('userData'), 'Receipts');
      if (!fs.existsSync(photoDir)) {
        fs.mkdirSync(photoDir, { recursive: true });
      }
      const targetPath = path.join(photoDir, filename || `photo-${Date.now()}.jpg`);
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(targetPath, buffer);
      return { success: true, localPath: targetPath };
    } catch (err) {
      console.error('Error saving photo file:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('printer:print-receipt', async (event, { html }) => {
    if (!mainWindow) return { success: false };
    mainWindow.webContents.print({ silent: false, printBackground: true });
    return { success: true };
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
