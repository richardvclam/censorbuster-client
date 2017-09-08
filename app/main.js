const { app, ipcMain, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const keytar = require('keytar');
const settings = require('electron-settings');
const mailbox = require('./mailbox.js');
const proxy = require('./proxy-server.js');
const api = require('./api.js');

// Keep a global reference of the window object,
// else the object will be garbage collected.
let window;

function createWindow() {
  // Create the browser window
  window = new BrowserWindow({ width: 480, height: 500 });

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
  const domain = email.substring(email.lastIndexOf('@') + 1, email.length);
  // Save user credentials to the native OS keystore.
  keytar.setPassword('CensorBuster', email, arg.password);
  // Save user data to the settings file.
  settings.set('config', {
    domain: domain,
    email: email,
    uuid: arg.uuid,
  });
  // Return a synchronous success message
  event.returnValue = true;
});

ipcMain.on('check-smtp', (event, arg) => {
  const email = arg.email;
  const domain = email.substring(email.lastIndexOf('@') + 1, email.length);
  event.returnValue = api.getSMTPSettings(domain);
});

ipcMain.on('validate-email', async (event, arg) => {
  const email = arg.email;
  // Get the domain substring
  const domain = email.substring(email.lastIndexOf('@') + 1, email.length);
  await api.sendMail(
    api.getSMTPSettings(domain),
    {
      from: email,
      subject: 'Validating Email',
      text: '',
    },
    {
      username: email,
      password: arg.password,
    },
  )
  .then((credentials) => {
    event.sender.send('validated-email', { success: true });
  })
  .catch((error) => {
    event.sender.send('validated-email', { success: false });
  });
});

// Connect event handler.
// Sends an email to the email server, parses JSON configuration
// file, creates a .ovpn file, and connects to the DVP server.
ipcMain.on('connect', async (event, arg) => {
  const email = settings.get('config.email');
  const uuid = settings.get('config.uuid');

  // Since retrieving passwords from keystore is async,
  // we have to use the await keyword to wait for the promise
  // to resolve.
  const password = await keytar.getPassword('CensorBuster', email);

  // Send email to email server, connects to mailbox, listens for an incoming
  // mail with DVP data, parses the JSON data, and finally start up local
  // proxy that points to the DVP.
  api.sendMail(
    api.getSMTPSettings(settings.get('config.domain')),
    {
      from: email,
      subject: 'list',
      text: uuid,
    },
    {
      username: email,
      password: password,
    },
  )
  .then((credentials) => {
    event.sender.send('requested-dvp', {});
    return mailbox.start(credentials);
  })
  .then((dvp) => {
    event.sender.send('received-dvp', {});
    return proxy.start(dvp);
  })
  .catch(console.error);
});
