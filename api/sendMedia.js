const fetch = require('node-fetch');
const FormData = require('form-data');
const formidable = require('formidable');
const fs = require('fs');

module.exports = async (req, res) => {
  const botToken = process.env.TOKEN;
  const allowedOrigin = 'https://youtube-dow1.vercel.app'; // ← دامنه مجاز

  if (req.headers.origin && req.headers.origin !== allowedOrigin) {
    return res.status(403).json({ ok: false, error: 'Invalid origin' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ ok: false, error: 'Failed to parse form data.' });
    }

    const allowedFields = ['chat_id', 'caption'];
    const allowedFiles = ['photo', 'audio'];
    for (const key in fields) {
      if (!allowedFields.includes(key)) {
        return res.status(400).json({ ok: false, error: 'Invalid input field: ' + key });
      }
    }
    for (const key in files) {
      if (!allowedFiles.includes(key)) {
        return res.status(400).json({ ok: false, error: 'Invalid file field: ' + key });
      }
    }

    const chatId = fields.chat_id;
    const caption = fields.caption;

    if (!chatId || !caption) {
      return res.status(400).json({ ok: false, error: 'chat_id and caption are required.' });
    }

    const allowedCaption = '⚡Join ➣ @Hekmat_King';
    if (caption !== allowedCaption) {
      return res.status(403).json({ ok: false, error: 'Invalid caption' });
    }

    try {
      if (files.photo) {
        const photoFile = files.photo;
        if (!photoFile.filepath || photoFile.size > 20 * 1024 * 1024) {
          return res.status(400).json({ ok: false, error: 'Invalid photo file.' });
        }

        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('photo', fs.createReadStream(photoFile.filepath), { filename: 'photo.jpg' });
        formData.append('caption', caption);

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
          method: 'POST',
          body: formData
        });
        const result = await response.json();
        if (!result.ok) {
          return res.status(500).json({ ok: false, error: result.description });
        }
      }

      if (files.audio) {
        const audioFile = files.audio;
        if (!audioFile.filepath || audioFile.size > 50 * 1024 * 1024) {
          return res.status(400).json({ ok: false, error: 'Invalid audio file.' });
        }

        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('audio', fs.createReadStream(audioFile.filepath), { filename: 'audio.wav' });
        formData.append('caption', caption);

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendAudio`, {
          method: 'POST',
          body: formData
        });
        const result = await response.json();
        if (!result.ok) {
          return res.status(500).json({ ok: false, error: result.description });
        }
      }

      return res.status(200).json({ ok: true });
    } catch (error) {
      return res.status(500).json({ ok: false, error: 'Failed to send media: ' + error.message });
    }
  });
};
