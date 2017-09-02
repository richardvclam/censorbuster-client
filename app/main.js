const { app, ipcMain, BrowserWindow } = require('electron');
const electronOauth2 = require('electron-oauth2');
const Imap = require('imap');
const path = require('path');
const url = require('url');
const keytar = require('keytar');
const settings = require('electron-settings');
const oauthConfig = require('./config.js');
const mailbox = require('./mailbox.js');
const api = require('./api.js');

// Keep a global reference of the window object,
// else the object will be garbage collected.
let window;

// Window parameters for the OAuth pop-up window
const windowParams = {
  alwaysOnTop: true,
  autoHideMenuBar: true,
  webPreferences: {
    nodeIntegration: false,
  },
};

const googleOAuth = electronOauth2(oauthConfig, windowParams);

function createWindow() {
  // Create the browser window
  window = new BrowserWindow({ width: 400, height: 600 });

  // Remove the menu bar from the window
  window.setMenu(null);

  // Load the index.html file into the app
  window.loadURL(url.format({
    pathname: path.join(__dirname, '/public/index.html'),
    protocol: 'file:',
    slashes: true,
  }));

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
  googleOAuth.getAccessToken({ 
    scope: 'https://mail.google.com/&prompt=select_account'
  })
    .then((token) => {
      event.sender.send('google-oauth-reply', token);
    }, (err) => {
      console.log('Error while getting token', err);
    });
});

// Check if user has already set up their credentials
ipcMain.on('has-credentials', (event, arg) => {
  // Checks to see if email and UUID exists
  if (settings.get('config.email') && settings.get('config.uuid')) {
    event.returnValue = true;
  } else {
    event.returnValue = false;
  }
});

// Save user credentials to native OS keystore and settings file.
// We'll save the email password to the OS keystore because
// it's sensitive information. We'll save the rest of the data
// in settings.
ipcMain.on('save-credentials', (event, arg) => {
  const email = arg.email;
  // Get the domain substring
  let domain = email.substring(email.lastIndexOf('@') + 1, email.length);
  // Save user credentials to the native OS keystore.
  keytar.setPassword('CensorBuster', email, arg.password);
  // Save user data to the settings file.
  settings.set('config', {
    domain: domain,
    email: email,
    uuid: arg.uuid,
    uuidPassword: arg.uuidPassword,
  });
  // Return a synchronous success message
  event.returnValue = true;
}); 

// Connect event handler.
// Sends an email to the email server, parses JSON configuration
// file, creates a .ovpn file, and connects to the DVP server. 
ipcMain.on('connect', async (event, arg) => {
  const email = settings.get('config.email');
  
  // Since retrieving passwords from keystore is async,
  // we have to use the await keyword to wait for the promise
  // to resolve.
  const password = await keytar.getPassword('CensorBuster', email);

  // Send email to email server
  api.sendMail(
    api.getSMTPSettings(settings.get('config.domain')),
    {
      from: email,
      subject: `list`,
      text: '',
    },
    {
      username: email,
      password: password,
    }
  )
  .then(mailbox.connect)
  .catch(console.err);
});
