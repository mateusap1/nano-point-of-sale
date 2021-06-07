/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build:main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app, BrowserWindow, shell, dialog, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';

interface MessageArgs {
  command: string;
  payload: unknown;
}

interface ErrorArgs {
  message: string;
}

interface FilesArgs {
  options: Electron.OpenDialogSyncOptions;
}

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let appWindow: BrowserWindow | null = null;
let hiddenWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  appWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: true,
    },
  });

  hiddenWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: true,
    },
  });

  appWindow.loadURL(`file://${__dirname}/app/index.html`);
  hiddenWindow.loadURL(`file://${__dirname}/hidden/index.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  appWindow.webContents.on('did-finish-load', () => {
    if (!appWindow) {
      throw new Error('"appWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      appWindow.minimize();
    } else {
      appWindow.show();
      appWindow.focus();
    }
  });

  // *!: Toggle when debugging
  // hiddenWindow.webContents.on('did-finish-load', () => {
  //   if (!hiddenWindow) {
  //     throw new Error('"hiddenWindow" is not defined');
  //   }
  //   if (process.env.START_MINIMIZED) {
  //     hiddenWindow.minimize();
  //   } else {
  //     hiddenWindow.show();
  //     hiddenWindow.focus();
  //   }
  // });

  appWindow.on('closed', () => {
    appWindow = null;

    hiddenWindow?.close();
    hiddenWindow = null;
  });

  const menuBuilder1 = new MenuBuilder(appWindow);
  const menuBuilder2 = new MenuBuilder(hiddenWindow);
  menuBuilder1.buildMenu();
  menuBuilder2.buildMenu();

  // Open urls in the user's browser
  appWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add Helper Functions...
 */

function showError(message: string) {
  if (appWindow === null)
    throw new Error("Cant's display error when appWindow is null");

  dialog.showMessageBox(appWindow, {
    message,
    type: 'error',
    buttons: ['Ok'],
  });
}

function sendWindowMessage(
  targetWindow: BrowserWindow,
  message: string,
  payload: unknown
) {
  // Send message to window renderer if

  if (typeof targetWindow === 'undefined') {
    console.log('Target window does not exist');
    showError('Program crashed, try restarting it');
    return;
  }

  targetWindow.webContents.send(message, payload);
}

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(createWindow).catch(console.log);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (appWindow === null) createWindow();
});

ipcMain.handle('update-transactions', () => {
  ipcMain.handle('hidden-renderer-ready', () => {
    if (hiddenWindow !== null) {
      sendWindowMessage(hiddenWindow, 'update-transactions', {});
    }
  });
});

ipcMain.handle(
  'message-from-main',
  (_: Electron.IpcMainInvokeEvent, arg: MessageArgs) => {
    if (hiddenWindow !== null) {
      sendWindowMessage(hiddenWindow, 'message-from-main', arg);
    }
  }
);

ipcMain.handle(
  'message-from-worker',
  (_: Electron.IpcMainInvokeEvent, arg: MessageArgs) => {
    if (appWindow !== null) {
      sendWindowMessage(appWindow, 'message-from-worker', arg);
    }
  }
);

ipcMain.handle('renderer-error', (_, arg: ErrorArgs) => {
  const { message } = arg;

  if (appWindow !== null) {
    dialog.showMessageBox(appWindow, {
      message,
      type: 'error',
      buttons: ['Ok'],
    });
  }
});

ipcMain.handle('show-files', (_, arg: FilesArgs) => {
  const { options } = arg;

  if (appWindow !== null && hiddenWindow !== null) {
    const csvPaths = dialog.showOpenDialogSync(appWindow, options);

    if (csvPaths) {
      sendWindowMessage(hiddenWindow, 'message-from-main', {
        command: 'import-csv',
        payload: { csvPath: csvPaths[0] },
      });

      sendWindowMessage(hiddenWindow, 'message-from-main', {
        command: 'update-info',
        payload: {},
      });
    }
  }
});
