const fetch = require('node-fetch');
const formidable = require('formidable');
const fs = require('fs');

module.exports = async (req, res) => {
  const botToken = process.env.TOKEN;
  const allowedOrigin = 'https://youtube-dow1.vercel.app';
  const fixedCaption = '⚡Join ➣ @Hekmat_King';

  if (!botToken) {
    console.error('Bot token not configured.');
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }

  if (req.headers.origin && req.headers.origin !== allowedOrigin) {
    console.error('Invalid origin:', req.headers.origin);
    return res.status(403).json({ ok: false, error: 'Invalid origin' });
  }

  if (req.method !== 'POST') {
    console.error('Method not allowed:', req.method);
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm();

  const isValidChatId = (chatId) => {
    return !isNaN(parseInt(chatId));
  };

  const isValidFileType = (file, allowedTypes) => {
    return file && file.mimetype && allowedTypes.includes(file.mimetype);
  };

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ ok: false, error: 'Internal server error' });
    }

    const allowedFields = ['chat_id'];
    for (const field in fields) {
      if (!allowedFields.includes(field)) {
        console.error('Invalid input field:', field);
        return res.status(400).json({ ok: false, error: 'Invalid input field' });
      }
    }

    const { chat_id: chatId } = fields;

    if (!chatId || !isValidChatId(chatId)) {
      console.error('Invalid or missing chat_id:', chatId);
      return res.status(400).json({ ok: false, error: 'Invalid or missing chat_id' });
    }

    try {

      if (files.photo) {
        if (!files.photo.filepath) {
          console.error('Photo filepath not found:', files.photo);
          return res.status(400).json({ ok: false, error: 'Invalid photo file' });
        }

        const allowedImageTypes = ['image/jpeg', 'image/png'];
        if (!isValidFileType(files.photo, allowedImageTypes)) {
          console.error('Invalid photo type:', files.photo.mimetype);
          return res.status(400).json({ ok: false, error: 'Invalid photo type (only JPEG/PNG allowed)' });
        }

        if (files.photo.size > 20 * 1024 * 1024) {
          console.error('Photo too large:', files.photo.size);
          return res.status(400).json({ ok: false, error: 'Photo too large (max 20 MB)' });
        }

        const formData = new formidable.FormData();
        formData.append('chat_id', chatId);
        formData.append('photo', fs.createReadStream(files.photo.filepath), { filename: 'photo.jpg' });
        formData.append('caption', fixedCaption);

        const responsePhoto = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
          method: 'POST',
          body: formData
        });
        const resultPhoto = await responsePhoto.json();

        if (!resultPhoto.ok) {
          console.error('Telegram API error (photo):', resultPhoto);
          return res.status(500).json({ ok: false, error: 'Internal server error' });
        }
        console.log('Photo sent successfully:', resultPhoto);

        try {
          fs.unlinkSync(files.photo.filepath);
        } catch (unlinkErr) {
          console.error('Error deleting photo file:', unlinkErr);
        }
      }

      if (files.audio) {
        if (!files.audio.filepath) {
          console.error('Audio filepath not found:', files.audio);
          return res.status(400).json({ ok: false, error: 'Invalid audio file' });
        }

        const allowedAudioTypes = ['audio/mpeg', 'audio/wav'];
        if (!isValidFileType(files.audio, allowedAudioTypes)) {
          console.error('Invalid audio type:', files.audio.mimetype);
          return res.status(400).json({ ok: false, error: 'Invalid audio type (only MP3/WAV allowed)' });
        }

        if (files.audio.size > 50 * 1024 * 1024) {
          console.error('Audio too large:', files.audio.size);
          return res.status(400).json({ ok: false, error: 'Audio too large (max 50 MB)' });
        }

        const formData = new formidable.FormData();
        formData.append('chat_id', chatId);
        formData.append('audio', fs.createReadStream(files.audio.filepath), { filename: 'audio.wav' });
        formData.append('caption', fixedCaption);

        const responseAudio = await fetch(`https://api.telegram.org/bot${botToken}/sendAudio`, {
          method: 'POST',
          body: formData
        });
        const resultAudio = await responseAudio.json();

        if (!resultAudio.ok) {
          console.error('Telegram API error (audio):', resultAudio);
          return res.status(500).json({ ok: false, error: 'Internal server error' });
        }
        console.log('Audio sent successfully:', resultAudio);

        // حذف فایل موقت
        try {
          fs.unlinkSync(files.audio.filepath);
        } catch (unlinkErr) {
          console.error('Error deleting audio file:', unlinkErr);
        }
      }

      // بررسی اینکه حداقل یک فایل ارسال شده باشد
      if (!files.photo && !files.audio) {
        console.error('No photo or audio provided');
        return res.status(400).json({ ok: false, error: 'No photo or audio provided' });
      }

      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Error in sendMedia:', error);
      return res.status(500).json({ ok: false, error: 'Internal server error' });
    }
  });
};
