// app.js handles the look and feel of the application. All functionality
// is piped through ipcRenderer and ipcMain to main.js
const ipcRenderer = require('electron').ipcRenderer;

let email;
let password;
let uuid;

function showLogin() {
  $('#main').hide();
  $('#login').show();
}

function showMain() {
  $('#login').hide();
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
    $('#login').show();
  }
});

$('#continue-email').on('click', () => {
  email = $('#email').val();
  if (validateEmail(email)) {
    $('#email').removeClass('is-invalid');
    password = $('#password').val();
    $('#email-view').hide();
    $('#uuid-view').show();
  } else {
    $('#email').addClass('is-invalid');
  }
});

$('#submit-uuid').on('click', () => {
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

$('#continue-password').on('click', () => {
  password = $('#password').val();
  showMain();
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
