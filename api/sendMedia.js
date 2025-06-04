const fetch = require('node-fetch');
const FormData = require('form-data');
const formidable = require('formidable');
const fs = require('fs').promises;
const fileType = require('file-type');

module.exports = async (req, res) => {
  const botToken = process.env.TOKEN;
  const allowedOrigin = 'https://youtube-dow1.vercel.app'; // دامنه مجاز خود را وارد کنید
  const fixedCaption = '⚡Join ➣ @Hekmat_King';

  // بررسی وجود توکن ربات
  if (!botToken) {
    console.error('Bot token not configured.');
    return res.status(500).json({ ok: false, error: 'Bot token not configured.' });
  }

  // بررسی متد درخواست
  if (req.method !== 'POST') {
    console.error('Method not allowed:', req.method);
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  // بررسی دامنه درخواست
  const origin = req.headers.origin || req.headers.referer;
  if (!origin || !origin.startsWith(allowedOrigin)) {
    console.error('Unauthorized domain:', origin);
    return res.status(403).json({ ok: false, error: 'Unauthorized domain.' });
  }

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ ok: false, error: 'Failed to parse form data.' });
    }

    // بررسی chat_id
    const chatId = fields.chat_id;
    if (!chatId || !/^-?\d+$/.test(chatId)) {
      console.error('Invalid or missing chat_id:', chatId);
      return res.status(400).json({ ok: false, error: 'Valid chat_id is required.' });
    }

    // بررسی کپشن
    const caption = fields.caption;
    if (caption && caption !== fixedCaption) {
      console.error('Invalid caption provided:', caption);
      return res.status(400).json({ ok: false, error: 'Only the fixed caption is allowed.' });
    }

    try {
      if (files.photo) {
        if (!files.photo.filepath) {
          console.error('Photo filepath not found:', files.photo);
          return res.status(400).json({ ok: false, error: 'Photo filepath not found.' });
        }

        // بررسی نوع فایل
        const fileInfo = await fileType.fromFile(files.photo.filepath);
        if (!fileInfo || !['image/jpeg', 'image/png'].includes(fileInfo.mime)) {
          console.error('Invalid photo format:', fileInfo ? fileInfo.mime : 'unknown');
          await fs.unlink(files.photo.filepath).catch(() => {}); // حذف فایل موقت
          return res.status(400).json({ ok: false, error: 'Only JPEG/PNG photos are allowed.' });
        }

        // بررسی حجم فایل
        if (files.photo.size > 20 * 1024 * 1024) {
          console.error('Photo too large:', files.photo.size);
          await fs.unlink(files.photo.filepath).catch(() => {}); // حذف فایل موقت
          return res.status(400).json({ ok: false, error: 'Photo too large (max 20 MB).' });
        }

        console.log('Processing photo, file size:', files.photo.size);
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('photo', fs.createReadStream(files.photo.filepath), { filename: 'photo.jpg' });
        formData.append('caption', fixedCaption);

        const responsePhoto = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
          method: 'POST',
          body: formData
        });
        const resultPhoto = await responsePhoto.json();

        await fs.unlink(files.photo.filepath).catch(() => {}); // حذف فایل موقت

        if (!resultPhoto.ok) {
          console.error('Telegram API error (photo):', resultPhoto);
          return res.status(500).json({ ok: false, error: resultPhoto.description });
        }
        console.log('Photo sent successfully:', resultPhoto);
      } else if (files.audio) {
        if (!files.audio.filepath) {
          console.error('Audio filepath not found:', files.audio);
          return res.status(400).json({ ok: false, error: 'Audio filepath not found.' });
        }

        // بررسی نوع فایل
        const fileInfo = await fileType.fromFile(files.audio.filepath);
        if (!fileInfo || !['audio/wav', 'audio/mpeg'].includes(fileInfo.mime)) {
          console.error('Invalid audio format:', fileInfo ? fileInfo.mime : 'unknown');
          await fs.unlink(files.audio.filepath).catch(() => {}); // حذف فایل موقت
          return res.status(400).json({ ok: false, error: 'Only WAV/MP3 audio files are allowed.' });
        }

        // بررسی حجم فایل
        if (files.audio.size > 50 * 1024 * 1024) {
          console.error('Audio too large:', files.audio.size);
          await fs.unlink(files.audio.filepath).catch(() => {}); // حذف فایل موقت
          return res.status(400).json({ ok: false, error: 'Audio too large (max 50 MB).' });
        }

        console.log('Processing audio, file size:', files.audio.size);
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('audio', fs.createReadStream(files.audio.filepath), { filename: 'audio.wav' });
        formData.append('caption', fixedCaption);

        const responseAudio = await fetch(`https://api.telegram.org/bot${botToken}/sendAudio`, {
          method: 'POST',
          body: formData
        });
        const resultAudio = await responseAudio.json();

        await fs.unlink(files.audio.filepath).catch(() => {}); // حذف فایل موقت

        if (!resultAudio.ok) {
          console.error('Telegram API error (audio):', resultAudio);
          return res.status(500).json({ ok: false, error: resultAudio.description });
        }
        console.log('Audio sent successfully:', resultAudio);
      } else {
        console.error('No valid photo or audio file provided.');
        return res.status(400).json({ ok: false, error: 'No valid photo or audio file provided.' });
      }

      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Error in sendMedia:', error);
      return res.status(500).json({ ok: false, error: 'Failed to send media: ' + error.message });
    }
  });
};
