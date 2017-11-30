const { app, ipcMain, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

app.on('ready', () => {
  ipcMain.on('error', app.exit.bind(app, 1));

  const window = new BrowserWindow({ show: false });

  window.loadURL(url.format({
    pathname: path.join(__dirname, 'renderer.html'),
    protocol: 'file:',
  }));
});

app.on('window-all-closed', app.quit.bind(app));
