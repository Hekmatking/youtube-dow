const fetch = require('node-fetch');
const FormData = require('form-data');
const formidable = require('formidable');
const fs = require('fs');

module.exports = async (req, res) => {
  const botToken = process.env.TOKEN;

  if (!botToken) {
    console.error('Bot token not configured.');
    return res.status(500).json({ ok: false, error: 'Bot token not configured.' });
  }

  if (req.method !== 'POST') {
    console.error('Method not allowed:', req.method);
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ ok: false, error: 'Failed to parse form data.' });
    }

    const chatId = fields.chat_id;
    const caption = fields.caption || '⚡Join ➣ @Hekmat_King';

    if (!chatId) {
      console.error('Chat ID is required, got:', chatId);
      return res.status(400).json({ ok: false, error: 'Chat ID is required.' });
    }

    try {
      if (files.photo) {
        if (!files.photo.filepath) {
          console.error('Photo filepath not found:', files.photo);
          return res.status(400).json({ ok: false, error: 'Photo filepath not found.' });
        }
        console.log('Processing photo, file size:', files.photo.size);
        if (files.photo.size > 20 * 1024 * 1024) {
          console.error('Photo too large:', files.photo.size);
          return res.status(400).json({ ok: false, error: 'Photo too large (max 20 MB).' });
        }

        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('photo', fs.createReadStream(files.photo.filepath), { filename: 'photo.jpg' });
        formData.append('caption', caption);

        const responsePhoto = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
          method: 'POST',
          body: formData
        });
        const resultPhoto = await responsePhoto.json();

        if (!resultPhoto.ok) {
          console.error('Telegram API error (photo):', resultPhoto);
          return res.status(500).json({ ok: false, error: resultPhoto.description });
        }
        console.log('Photo sent successfully:', resultPhoto);
      }

      if (files.audio) {
        if (!files.audio.filepath) {
          console.error('Audio filepath not found:', files.audio);
          return res.status(400).json({ ok: false, error: 'Audio filepath not found.' });
        }
        console.log('Processing audio, file size:', files.audio.size);
        if (files.audio.size > 50 * 1024 * 1024) {
          console.error('Audio too large:', files.audio.size);
          return res.status(400).json({ ok: false, error: 'Audio too large (max 50 MB).' });
        }

        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('audio', fs.createReadStream(files.audio.filepath), { filename: 'audio.wav' });
        formData.append('caption', caption);

        const responseAudio = await fetch(`https://api.telegram.org/bot${botToken}/sendAudio`, {
          method: 'POST',
          body: formData
        });
        const resultAudio = await responseAudio.json();

        if (!resultAudio.ok) {
          console.error('Telegram API error (audio):', resultAudio);
          return res.status(500).json({ ok: false, error: resultAudio.description });
        }
        console.log('Audio sent successfully:', resultAudio);
      }

      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Error in sendMedia:', error);
      return res.status(500).json({ ok: false, error: 'Failed to send media: ' + error.message });
    }
  });
};
