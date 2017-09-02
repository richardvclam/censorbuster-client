const Imap = require('imap');
const inspect = require('util').inspect;

const serverEmail = 'censorbustorstest1@gmail.com';

function connect(credentials) {
  const imap = new Imap({
    host: 'imap.gmail.com',
    port: '993',
    tls: true,
    user: credentials.username,
    password: credentials.password,
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
        imap.search(['UNSEEN', ['FROM', serverEmail]], (err, results) => {
          if (err) console.error(err);

          if (results.length > 0) {
            // Fetch all fields from emails and mark as seen.
            const fetch = imap.fetch(results, {
              bodies: ['TEXT'],
              markSeen: true,
              struct: true,
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
                  console.log(buffer);
                  console.log('end end');
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
}

module.exports = { connect };
