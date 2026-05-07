const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = 'Assisted Stretches <noreply@assistedstretches.com>';

async function sendGiftCardEmail({ recipientEmail, recipientName, purchaserName, code, productLabel, sessions, expiryDate, giftMessage }) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM,
      to: recipientEmail,
      subject: `Your Assisted Stretches gift card from ${purchaserName}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;background:#F0ECE6;padding:40px 32px;border-radius:12px;">
          <h1 style="color:#2D3D35;font-size:28px;font-weight:400;margin-bottom:8px;">You've received a gift card.</h1>
          <p style="color:#6B6054;font-size:15px;line-height:1.7;margin-bottom:28px;">
            ${purchaserName} has given you ${sessions === 1 ? 'a session' : `${sessions} sessions`} of one-on-one assisted stretching.
          </p>
          ${giftMessage ? `
          <div style="background:#fff;border-left:3px solid #C8856A;padding:16px 20px;margin-bottom:28px;border-radius:0 8px 8px 0;">
            <p style="color:#2D3D35;font-style:italic;font-size:15px;line-height:1.7;margin:0;">"${giftMessage}"</p>
            <p style="color:#6B6054;font-size:13px;margin:8px 0 0;">— ${purchaserName}</p>
          </div>` : ''}
          <div style="background:#2D3D35;color:#F0ECE6;padding:28px;border-radius:10px;text-align:center;margin-bottom:28px;">
            <p style="font-size:11px;letter-spacing:0.12em;margin-bottom:10px;color:#D4C4A8;font-family:sans-serif;">YOUR GIFT CARD CODE</p>
            <p style="font-size:30px;font-family:'Courier New',monospace;letter-spacing:0.14em;margin:0;color:#C8856A;font-weight:700;">${code}</p>
          </div>
          <div style="font-size:14px;color:#6B6054;line-height:2.2;">
            <div><strong style="color:#2D3D35;">Package:</strong> ${productLabel}</div>
            <div><strong style="color:#2D3D35;">Sessions included:</strong> ${sessions}</div>
            <div><strong style="color:#2D3D35;">Valid until:</strong> ${expiryDate}</div>
          </div>
          <p style="font-size:13px;color:#9C5E3C;margin-top:24px;line-height:1.6;">
            To book, visit assistedstretches.com.au and enter your code at checkout.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Gift card email error (non-fatal):', err.message);
  }
}

async function sendBookingConfirmationEmail({ email, firstName, sessionDate, sessionTime, productLabel }) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Booking confirmed — ${sessionDate} at ${sessionTime}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;background:#F0ECE6;padding:40px 32px;border-radius:12px;">
          <h1 style="color:#2D3D35;font-size:28px;font-weight:400;margin-bottom:8px;">You're booked, ${firstName}.</h1>
          <div style="background:#fff;border-radius:10px;padding:20px 24px;margin:24px 0;font-size:14px;line-height:2.2;color:#6B6054;">
            <div><strong style="color:#2D3D35;">Service:</strong> ${productLabel}</div>
            <div><strong style="color:#2D3D35;">Date:</strong> ${sessionDate}</div>
            <div><strong style="color:#2D3D35;">Time:</strong> ${sessionTime}</div>
          </div>
          <p style="font-size:13px;color:#6B6054;line-height:1.7;">
            Please arrive 5 minutes early in comfortable clothing. To cancel or reschedule, contact us at least 24 hours before.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Booking confirmation email error (non-fatal):', err.message);
  }
}

async function sendContactEnquiryEmail({ name, email, phone, message }) {
  if (!resend) { console.log('Contact enquiry (demo):', { name, email, phone, message }); return; }
  try {
    await resend.emails.send({
      from: FROM,
      to: 'hello@assistedstretches.com',
      replyTo: email,
      subject: `New enquiry from ${name}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;background:#F0ECE6;padding:40px 32px;border-radius:12px;">
          <h1 style="color:#2D3D35;font-size:24px;font-weight:400;margin-bottom:20px;">New website enquiry</h1>
          <div style="background:#fff;border-radius:10px;padding:20px 24px;margin-bottom:24px;font-size:14px;line-height:2.2;color:#6B6054;">
            <div><strong style="color:#2D3D35;">Name:</strong> ${name}</div>
            <div><strong style="color:#2D3D35;">Email:</strong> ${email}</div>
            ${phone ? `<div><strong style="color:#2D3D35;">Phone:</strong> ${phone}</div>` : ''}
          </div>
          <div style="background:#fff;border-radius:10px;padding:20px 24px;font-size:14px;line-height:1.7;color:#6B6054;">
            <strong style="color:#2D3D35;">Message:</strong>
            <p style="margin:10px 0 0;white-space:pre-wrap;">${message}</p>
          </div>
          <p style="font-size:12px;color:#9C9088;margin-top:24px;">Reply directly to this email to respond to ${name}.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Contact enquiry email error:', err.message);
    throw err;
  }
}

async function sendBookingCancellationEmail({ first_name, last_name, email, session_date, session_time, reason }) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Your Assisted Stretches booking has been cancelled',
      html: `
        <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;background:#F0ECE6;padding:40px 32px;border-radius:12px;">
          <h1 style="color:#2D3D35;font-size:28px;font-weight:400;margin-bottom:8px;">Hi ${first_name},</h1>
          <p style="color:#6B6054;font-size:15px;line-height:1.7;margin-bottom:24px;">
            We're sorry to let you know that your booking has been cancelled.
          </p>
          <div style="background:#fff;border-radius:10px;padding:20px 24px;margin:0 0 24px;font-size:14px;line-height:2.2;color:#6B6054;">
            <div><strong style="color:#2D3D35;">Date:</strong> ${session_date}</div>
            <div><strong style="color:#2D3D35;">Time:</strong> ${session_time}</div>
            ${reason ? `<div><strong style="color:#2D3D35;">Reason:</strong> ${reason}</div>` : ''}
          </div>
          <p style="color:#6B6054;font-size:14px;line-height:1.7;margin-bottom:20px;">
            We'd love to have you back — please don't hesitate to rebook at a time that works for you.
            Visit <a href="https://assistedstretches.com.au" style="color:#C8856A;">assistedstretches.com.au</a> to choose a new time.
          </p>
          <p style="color:#9C9088;font-size:13px;line-height:1.6;">
            If you have any questions, feel free to reply to this email. We look forward to seeing you soon.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Cancellation email error (non-fatal):', err.message);
  }
}

module.exports = { sendGiftCardEmail, sendBookingConfirmationEmail, sendBookingCancellationEmail, sendContactEnquiryEmail };
