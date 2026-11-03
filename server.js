const express = require('express');
const Unblocker = require('unblocker');
const path = require('path');

const PASS = process.env.PROXY_PASSWORD;
if (!PASS) {
  console.error('Set the PROXY_PASSWORD environment variable.');
  process.exit(1);
}

// log errors instead of crashing the whole server
process.on('uncaughtException', (e) => console.error('uncaught:', e));
process.on('unhandledRejection', (e) => console.error('unhandled:', e));

const app = express();

app.use((req, res, next) => {
  const encoded = (req.headers.authorization || '').split(' ')[1] || '';
  const pw = Buffer.from(encoded, 'base64').toString().split(':').slice(1).join(':');
  if (pw === PASS) return next();
  res.set('WWW-Authenticate', 'Basic realm="proxy"').status(401).send('Login required');
});

const unblocker = new Unblocker({ prefix: '/proxy/' });
app.use(unblocker);

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Something went wrong loading that page. Try another site.');
});

const port = process.env.PORT || 8080;
app.listen(port).on('upgrade', unblocker.onUpgrade);
