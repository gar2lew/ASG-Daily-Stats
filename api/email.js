import nodemailer from 'nodemailer';
import { assertEnv, checkPasscode } from '../lib/draps.js';

// Subject must be exactly: DRAPS - Rep Name - Day - DD/MM/YYYY
const SUBJECT_PATTERN = /^DRAPS - [^\r\n]{1,120} - (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday) - \d{2}\/\d{2}\/\d{4}$/;

// POST /api/email  { subject, body }   header: x-draps-passcode
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const auth = checkPasscode(req);
  if (!auth.ok) return res.status(auth.status).json({ ok: false, error: auth.error });

  try {
    assertEnv(['GMAIL_USER', 'GMAIL_APP_PASSWORD', 'MANAGEMENT_RECIPIENTS']);

    const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim() : '';
    const body = typeof req.body?.body === 'string' ? req.body.body : '';

    if (!SUBJECT_PATTERN.test(subject)) return res.status(400).json({ ok: false, error: 'Subject format is invalid' });
    if (!body || body.length > 10000) return res.status(400).json({ ok: false, error: 'Report body is missing or too long' });

    const recipients = process.env.MANAGEMENT_RECIPIENTS.split(',').map(s => s.trim()).filter(Boolean);
    if (!recipients.length) return res.status(500).json({ ok: false, error: 'No management recipients configured' });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: recipients,
      subject,
      text: body,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('email failed', error);
    return res.status(500).json({ ok: false, error: 'Email could not be sent. Check the server logs.' });
  }
}
