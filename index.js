import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;

// لإيجاد المسار الحالي لأن __dirname غير مدعوم مباشرة في ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// مفاتيح API المسموحة
const validApiKeys = ['abc123', 'mykey456', 'samikey789'];

let urls = {};
const dbFile = path.join(__dirname, 'urls.json');

if (fs.existsSync(dbFile)) {
  urls = JSON.parse(fs.readFileSync(dbFile));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function generateCode(length = 5) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// واجهة المستخدم (HTML)
app.post('/shorten', (req, res) => {
  const originalUrl = req.body.url;
  if (!originalUrl || !originalUrl.startsWith('http')) {
    return res.send('رابط غير صالح');
  }

  const code = generateCode();
  urls[code] = originalUrl;
  fs.writeFileSync(dbFile, JSON.stringify(urls));
  res.send(`الرابط المختصر هو: <a href="/${code}">localhost:3000/${code}</a>`);
});

// API لسكربتات أو بوتات
app.post('/api/shorten', (req, res) => {
  const { originalUrl, apiKey } = req.body;

  if (!apiKey || !validApiKeys.includes(apiKey)) {
    return res.status(401).json({ error: 'API Key غير صالح' });
  }

  if (!originalUrl || !originalUrl.startsWith('http')) {
    return res.status(400).json({ error: 'الرابط غير صالح' });
  }

  const code = generateCode();
  urls[code] = originalUrl;
  fs.writeFileSync(dbFile, JSON.stringify(urls));

  res.json({ shortUrl: `http://localhost:${PORT}/${code}` });
});

// التوجيه للرابط الأصلي
app.get('/:code', (req, res) => {
  const originalUrl = urls[req.params.code];
  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.status(404).send('الرابط غير موجود');
  }
});

app.listen(PORT, () => {
  console.log(`السيرفر شغال على http://localhost:${PORT}`);
});