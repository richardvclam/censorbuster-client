const ipcRenderer = require('electron').ipcRenderer;
const api = require('./api.js');

let gmailToken;

const continueEmail = document.getElementById('continue-email');
continueEmail.addEventListener('click', () => {
  const email = $('#email').val();
  if (api.validateEmail(email)) {
    console.log('Looks good!');
    let domain = email.substring(email.lastIndexOf('@') + 1, email.length);
    console.log(domain);
  } else {
    console.log('Invalid email');
  }
});

const connect = document.getElementById('connect');
connect.addEventListener('click', () => {
  api.sendMail()
    .then(console.log)
    .catch(console.err);
});

// When the user clicks Login, send an event 'getToken' to the
// channel 'google-oauth'.
const login = document.getElementById('login');
login.addEventListener('click', () => {
  ipcRenderer.send('google-oauth', 'getToken');
});

ipcRenderer.on('google-oauth-reply', (event, { access_token }) => {
  gmailToken = access_token;
});
