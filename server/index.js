require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { init } = require('./socket');
const webhookRouter = require('./webhook');
const db = require('./db');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);

init(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/display', express.static(path.join(__dirname, '../public/display')));
app.use('/student', express.static(path.join(__dirname, '../public/student')));
app.use(express.static(path.join(__dirname, '../public')));

app.use('/webhook', webhookRouter);

app.get('/api/menu', async (req, res) => {
  try {
    const result = await db.getFullMenu();
    res.json(result);
  } catch (err) {
    console.error('Error fetching menu:', err.message);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

app.get('/api/qrcode', async (req, res) => {
  const url = `${getPublicURL()}/student`;
  const qr = await QRCode.toDataURL(url);
  res.json({ qr, url });
});

function getPublicURL() {
  // On Render, this env var is set automatically to your live URL
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL;
  }
  // Optional manual override (set this in .env if you have a custom domain)
  if (process.env.PUBLIC_URL) {
    return process.env.PUBLIC_URL;
  }
  // Fallback for local development only
  return `http://localhost:${PORT}`;
}

const FEEDBACK_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScQ8Do2uSqBTKCMIS_IGq4vTifWQQxRu9C1hIuJlNsVzsXINQ/viewform';

async function generateQR() {
  const url = `${getPublicURL()}/student`;
  await QRCode.toFile(path.join(__dirname, '../public/qr.png'), url);
  console.log(`QR Code generated for: ${url} ✅`);

  await QRCode.toFile(path.join(__dirname, '../public/feedback-qr.png'), FEEDBACK_FORM_URL);
  console.log(`Feedback QR Code generated ✅`);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Public URL: ${getPublicURL()}`);
  await generateQR();
});