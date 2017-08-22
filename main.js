const { app, ipcMain, BrowserWindow } = require('electron');
const electronOauth2 = require('electron-oauth2');
const Imap = require('imap');
const path = require('path');
const url = require('url');
const oauthConfig = require('./app/oauth-config.js');

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
    pathname: path.join(__dirname, '/app/index.html'),
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
  googleOAuth.getAccessToken({ scope: 'https://mail.google.com/' })
    .then((token) => {
      event.sender.send('google-oauth-reply', token);
    }, (err) => {
      console.log('Error while getting token', err);
    });
});

ipcMain.on('email-list', (event, arg) => {
  const imap = new Imap({
    host: 'imap.gmail.com',
    port: '993',
    tls: true,
    user: 'censorbustorstest1@gmail.com',
    password: 'cens0r_csulb',
  });

  // Connect to IMAP mail box
  imap.once('ready', () => {
    // Open inbox with read-only set to false so we can modify
    // the seen flag.
    imap.openBox('INBOX', false, (err, box) => {
      console.log('Connected to inbox.');
      if (err) console.error(err);

      // When a new mail is received...
      imap.on('mail', (num) => {
        console.log('New mail received!');
        // Search for unopened emails
        imap.search(['UNSEEN'], (err, results) => {
          if (err) console.error(err);

          if (results.length > 0) {
            // Fetch from and subjects fields from emails
            // and mark them as seen.
            const fetch = imap.fetch(results, {
              bodies: 'HEADER.FIELDS (FROM SUBJECT)',
            });

            fetch.on('message', (message, sequenceNum) => {
              message.on('body', (stream, info) => {
                let buffer = '';

                // Parse the data from the emails
                stream.on('data', (chunk) => {
                  buffer += chunk.toString('utf8');
                });

                // After finishing parsing, send an email
                stream.once('end', () => {
                  const header = Imap.parseHeader(buffer);
                  const email = header.from[0].match(/<(.*?)>/)[1];
                  const subject = Imap.parseHeader(buffer).subject[0];

                  if (subject === 'list' || subject === 'LIST') {
                    event.sender.send('connected', true);
                    // Open process here!
                  }
                });
              });
            });

            fetch.once('error', (err) => {
              console.log(`Fetch error: ${err}`);
            });

            fetch.once('end', () => {
              console.log('Done fetching all messages.');
            });
          }
        });
      });
    });
  });

  imap.once('error', (err) => {
    console.log(err);
  });

  imap.once('end', () => {
    console.log('Connection ended');
  });

  imap.connect();
});
