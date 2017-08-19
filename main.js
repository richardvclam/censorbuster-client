const { app, ipcMain, BrowserWindow } = require('electron');
const electronOauth2 = require('electron-oauth2');
const path = require('path');
const url = require('url');
const oauthConfig = require('./app/oauth-config.js');

// Keep a global reference of the window object,
// else the object will be garbage collected.
let window;

const windowParams = {
  alwaysOnTop: true,
  autoHideMenuBar: true,
  webPreferences: {
    nodeIntegration: false,
  },
};

const googleOAuth = electronOauth2(oauthConfig, windowParams);
const startUrl = process.env.ELECTRON_START_URL || url.format({
  pathname: path.join(__dirname, '/public/index.html'),
  protocol: 'file:',
  slashes: true,
});

function createWindow() {
  // Create the browser window
  window = new BrowserWindow({ width: 400, height: 600 });

  // Load the index.html file into the app
  window.loadURL(startUrl);

  // Start window with dev tools opened
  window.webContents.openDevTools({ detach: true });

  window.on('closed', () => {
    window = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (window == null) {
    createWindow();
  }
});

// Listens to the channel 'google-oauth' for an event
ipcMain.on('google-oauth', (event, arg) => {
  googleOAuth.getAccessToken({ scope: 'https://mail.google.com/' })
    .then((token) => {
      event.sender.send('google-oauth-reply', token);
    }, (err) => {
      console.log('Error while getting token', err);
    });
});
