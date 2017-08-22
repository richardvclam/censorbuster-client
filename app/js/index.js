const ipcRenderer = require('electron').ipcRenderer;
const api = require('./api.js');

let gmailToken;
let email;
let password;
let domain;

function showLogin() {
  $('#main').hide();
  $('#login').show();
}

function showMain() {
  $('#login').hide();
  $('#main').show();
}

const continueEmail = document.getElementById('continue-email');
continueEmail.addEventListener('click', () => {
  email = $('#email').val();
  if (api.validateEmail(email)) {
    $('#email').removeClass('is-invalid');
    domain = email.substring(email.lastIndexOf('@') + 1, email.length);
    if (domain === 'gmail.com') {
      // Send an event 'getToken' to the channel 'google-oauth'.
      ipcRenderer.send('google-oauth', 'getToken');
    } else {
      $('#email-view').hide();
      $('#email-password-view').show();
    }
  } else {
    $('#email').addClass('is-invalid');
  }
});

$('#continue-password').click(() => {
  password = $('#password').val();
  showMain();
});

// Event listener listening for a Gmail OAuth token
ipcRenderer.on('google-oauth-reply', (event, { access_token }) => {
  console.log(access_token);
  gmailToken = access_token;
  showMain();
});

const connect = document.getElementById('connect');
connect.addEventListener('click', () => {
  // Send email to email server
  api.sendMail(
    api.getSMTPSettings(domain),
    {
      from: email,
      subject: 'list',
      text: '',
    },
    {
      username: email,
      password,
    },
    gmailToken,
  )
    .then(console.log)
    .catch(console.err);

  // Send an event down the pipeline to main electron process
  ipcRenderer.send('email-list', { domain, email, password, gmailToken });

  // Disable the button to prevent user from clicking multiple times
  $('#connect').prop('disabled', true);
  $('#connect').text('Connecting...');
});

ipcRenderer.on('connected', (event, arg) => {
  $('#connect').removeClass('btn-success').addClass('btn-danger');
  $('#connect').prop('disabled', false);
  $('#connect').text('Disconnect');
});
