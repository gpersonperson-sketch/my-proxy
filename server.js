const express = require('express');
const Unblocker = require('unblocker');

const PASS = process.env.PROXY_PASSWORD;
if (!PASS) {
  console.error('Set the PROXY_PASSWORD environment variable.');
  process.exit(1);
}

const app = express();

// password check: username can be anything, password must match
app.use((req, res, next) => {
  const encoded = (req.headers.authorization || '').split(' ')[1] || '';
  const pw = Buffer.from(encoded, 'base64').toString().split(':').slice(1).join(':');
  if (pw === PASS) return next();
  res.set('WWW-Authenticate', 'Basic realm="proxy"').status(401).send('Login required');
});

const unblocker = new Unblocker({ prefix: '/proxy/' });
app.use(unblocker);

app.get('/', (req, res) => {
  res.send(`
    <form onsubmit="location.href='/proxy/' + document.getElementById('u').value; return false;">
      <input id="u" placeholder="https://example.com" size="40">
      <button>Go</button>
    </form>
  `);
});

const port = process.env.PORT || 8080;
app.listen(port).on('upgrade', unblocker.onUpgrade);