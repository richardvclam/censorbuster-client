// app.js handles the look and feel of the application. All logic should
// be piped through ipcRenderer and ipcMain to main.js
const ipcRenderer = require('electron').ipcRenderer;

let email;
let password;
let uuid;

function showSetup() {
  $('#main').hide();
  $('#setup').show();
}

function showMain() {
  $('#setup').hide();
  $('#main').show();
}

function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

$(document).ready(() => {
  const result = ipcRenderer.sendSync('has-credentials', {});
  if (result) {
    $('#main').show();
  } else {
    $('#setup').show();
  }
});

$('#btn-continue-email').on('click', () => {
  email = $('#email').val();

  if (validateEmail(email)) {
    $('#email').removeClass('is-invalid');
    password = $('#password').val();

    // Check email domain to see if its a recognized SMTP configuration.
    const result = ipcRenderer.sendSync('check-smtp', { email });

    console.log(result);
    if (result === false) {
      // If email provider isn't recognized, request the user to add
      // the SMTP configuration manually.
      $('#email-view').hide();
      $('#smtp-view').show();
    } else {
      // If email provider is recognized, attempt to login using the
      // credentials provided by the user.
      ipcRenderer.send('validate-email', { email, password });
      $('#email-view').hide();
      $('#validate-email-view').show();
    }
  } else {
    $('#email').addClass('is-invalid');
  }
});

$('#btn-submit-uuid').on('click', () => {
  uuid = $('#uuid').val();
  // Synchronously save user credentials
  const result = ipcRenderer.sendSync('save-credentials', { email, password, uuid });
  // On successful save, move on
  if (result) {
    showMain();
  } else {
    console.log('There was an error saving credentials.');
  }
});

ipcRenderer.on('validated-email', (event, arg) => {
  if (arg.success) {
    // If email credentials are valid, navigate to UUID view.
    $('#validate-email-view').hide();
    $('#uuid-view').show();
  } else {
    // If email credentials are not valid, return user back to email
    // view and ask for credentials again.
    $('#email-header').hide();
    $('#email-header-invalid').show();
    $('#validate-email-view').hide();
    $('#email-view').show();
  }
});

const connect = $('#connect');
connect.on('click', () => {
  // Send an event down the pipeline to the main electron process
  ipcRenderer.send('connect', {});

  // Disable the button to prevent user from clicking multiple times
  connect.prop('disabled', true);
  connect.text('Connecting...');
  connect.hide();
  $('#loading').show();
});

ipcRenderer.on('connected', (event, arg) => {
  // Re-enable the button and changes it to 'Disconnect'
  connect.removeClass('btn-success').addClass('btn-danger');
  connect.prop('disabled', false);
  connect.text('Disconnect');
});

ipcRenderer.on('requested-dvp', (event, arg) => {
  $('#loading-label').text('Awaiting response from server...');
});

ipcRenderer.on('received-dvp', (event, arg) => {
  $('#loading-label').text('Received server response! Waiting for VPN...');
});
