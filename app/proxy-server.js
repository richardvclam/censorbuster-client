const fs = require('fs');
const net = require('net');
const tls = require('tls');

// Port of the VPN client to listen.
const vpnPort = 8081;
// Port of the DVP server to connect.
const dvpPort = 443;

function start(dvp) {
  // Grab data from the first DVP object in the array.
  const options = {
    host: dvp[0].ip,
    port: dvpPort,
    //key: dvp[0].rsa_public_key,
    ca: [fs.readFileSync('./app/cert/ca-chain.cert', 'utf8')],
  };

  console.log(options.key);

  const proxy = net.createServer((vpnSocket) => {
    console.log('Incoming VPN connection.');

    // Start connection with DVP
    const dvpSocket = tls.connect(options, () => {
      if (dvpSocket.authorized) {
        console.log('Established connection with DVP.');
        vpnSocket.pipe(dvpSocket);
      } else {
        console.error('Failed to establish connection with DVP. Unauthorized public key.');
      }
    });

    dvpSocket.on('data', (data) => {
      vpnSocket.write(data);
      console.log('Received data from DVP.');
    });

    dvpSocket.on('end', () => console.log('Connection with DVP has closed.'));

    dvpSocket.on('error', (error) => console.error(error));

    vpnSocket.on('error', (error) => console.error(error));
  });

  proxy.on('error', (error) => console.error(error));

  proxy.listen(vpnPort, () => console.log(`Proxy server has started. Listening on port ${vpnPort}.`));
}

module.exports = { start };
