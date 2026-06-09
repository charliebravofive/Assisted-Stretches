const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = 'Assisted Stretches <hello@assistedstretches.com>';

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

async function sendBookingConfirmationEmail({ email, firstName, lastName, phone, sessionDate, sessionTime, productLabel, notes }) {
  if (!resend) return;
  const fullName = `${firstName}${lastName ? ' ' + lastName : ''}`;
  try {
    // 1. Confirmation to client
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
          <div style="background:#fff;border-radius:10px;padding:20px 24px;margin:0 0 20px;font-size:14px;line-height:2;color:#6B6054;">
            <div><strong style="color:#2D3D35;">📍 Studio address:</strong> 41 Barton Parade, Balmoral QLD 4171</div>
          </div>
          <div style="background:#fff;border-radius:10px;padding:20px 24px;margin:0 0 20px;font-size:14px;line-height:1.75;color:#6B6054;">
            <div style="margin-bottom:8px;"><strong style="color:#2D3D35;">🚗 Arrival instructions</strong></div>
            <p style="margin:0 0 10px;">Street parking is available on Barton Parade.</p>
            <p style="margin:0 0 10px;">Upon arrival, please make yourself comfortable on the sofa on the front porch until you are collected for your appointment. I am likely to be with a client before you.</p>
            <p style="margin:0;">Many thanks</p>
          </div>
          <div style="background:#2D3D35;border-radius:10px;padding:20px 24px;margin:0 0 20px;">
            <p style="color:#F0ECE6;font-size:14px;line-height:1.7;margin:0 0 14px;">Please populate the new patient form prior to your first appointment via the attached link.</p>
            <a href="https://assistedstretches.com.au/#/new-patient-form" style="display:inline-block;background:#C8856A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">New Patient Form →</a>
          </div>
          <p style="font-size:13px;color:#6B6054;line-height:1.7;">
            Please arrive 5 minutes early in comfortable clothing. To cancel or reschedule, contact us at least 24 hours before.
          </p>
        </div>
      `,
    });

    // 2. Notification to Coley
    await resend.emails.send({
      from: FROM,
      to: 'hello@assistedstretches.com',
      subject: `New booking — ${fullName} on ${sessionDate} at ${sessionTime}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;background:#F0ECE6;padding:40px 32px;border-radius:12px;">
          <h1 style="color:#2D3D35;font-size:24px;font-weight:400;margin-bottom:8px;">New booking received</h1>
          <div style="background:#fff;border-radius:10px;padding:20px 24px;margin:24px 0;font-size:14px;line-height:2.2;color:#6B6054;">
            <div><strong style="color:#2D3D35;">Client:</strong> ${fullName}</div>
            <div><strong style="color:#2D3D35;">Email:</strong> ${email}</div>
            ${phone ? `<div><strong style="color:#2D3D35;">Phone:</strong> ${phone}</div>` : ''}
            <div><strong style="color:#2D3D35;">Service:</strong> ${productLabel}</div>
            <div><strong style="color:#2D3D35;">Date:</strong> ${sessionDate}</div>
            <div><strong style="color:#2D3D35;">Time:</strong> ${sessionTime}</div>
            ${notes ? `<div><strong style="color:#2D3D35;">Notes:</strong> ${notes}</div>` : ''}
          </div>
          <p style="font-size:12px;color:#9C9088;margin-top:8px;">View all bookings in your <a href="http://localhost:5173/admin" style="color:#C8856A;">admin portal</a>.</p>
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

async function sendWaiverEmail({
  first_name, last_name, email, phone, date_of_birth, heard_about_us,
  sleep_hours, sleep_quality, water_litres,
  exercise_frequency, exercise_types, exercise_ability,
  injuries, surgeries, goals, signature,
}) {
  if (!resend) return;
  const fullName = `${first_name} ${last_name}`.trim();
  const row = (label, value) => value
    ? `<div><strong style="color:#2D3D35;">${label}:</strong> ${String(value)}</div>`
    : '';
  try {
    await resend.emails.send({
      from: FROM,
      to: 'hello@assistedstretches.com',
      subject: `New waiver — ${fullName}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#F0ECE6;padding:40px 32px;border-radius:12px;">
          <h1 style="color:#2D3D35;font-size:24px;font-weight:400;margin-bottom:4px;">New client waiver received</h1>
          <p style="color:#9C9088;font-size:13px;margin:0 0 28px;">Submitted by ${fullName} on ${new Date().toLocaleDateString('en-AU', { day:'numeric', month:'long', year:'numeric' })}</p>

          <h2 style="color:#2D3D35;font-size:14px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 10px;">Client Details</h2>
          <div style="background:#fff;border-radius:10px;padding:20px 24px;margin-bottom:20px;font-size:14px;line-height:2.2;color:#6B6054;">
            ${row('Name', fullName)}
            ${row('Email', email)}
            ${row('Phone', phone)}
            ${row('Date of birth', date_of_birth)}
            ${row('Heard about us', heard_about_us)}
          </div>

          <h2 style="color:#2D3D35;font-size:14px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 10px;">Health & Lifestyle</h2>
          <div style="background:#fff;border-radius:10px;padding:20px 24px;margin-bottom:20px;font-size:14px;line-height:2.2;color:#6B6054;">
            ${row('Sleep (hrs/night)', sleep_hours)}
            ${row('Sleep quality', sleep_quality)}
            ${row('Water intake (L/day)', water_litres)}
            ${row('Exercise frequency', exercise_frequency)}
            ${row('Exercise types', Array.isArray(exercise_types) ? exercise_types.join(', ') : exercise_types)}
            ${row('Exercise ability', exercise_ability)}
          </div>

          <h2 style="color:#2D3D35;font-size:14px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 10px;">Medical History & Goals</h2>
          <div style="background:#fff;border-radius:10px;padding:20px 24px;margin-bottom:20px;font-size:14px;line-height:2.2;color:#6B6054;">
            ${row('Injuries / conditions', injuries || 'None disclosed')}
            ${row('Surgeries', surgeries || 'None disclosed')}
            ${row('Goals', goals || 'Not specified')}
          </div>

          <h2 style="color:#2D3D35;font-size:14px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 10px;">Agreements</h2>
          <div style="background:#fff;border-radius:10px;padding:20px 24px;margin-bottom:20px;font-size:14px;line-height:2.2;color:#6B6054;">
            <div>✅ Cancellation policy accepted</div>
            <div>✅ Injuries / conditions disclosed</div>
            <div>✅ Liability waiver accepted</div>
          </div>

          ${signature ? `
          <h2 style="color:#2D3D35;font-size:14px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 10px;">Signature</h2>
          <div style="background:#fff;border-radius:10px;padding:16px;margin-bottom:20px;text-align:center;">
            <img src="${signature}" alt="Client signature" style="max-width:100%;max-height:120px;border:1px solid #E8E0D5;border-radius:6px;" />
          </div>` : ''}

          <p style="font-size:12px;color:#9C9088;margin-top:8px;">View all waivers in your <a href="https://www.assistedstretches.com/admin" style="color:#C8856A;">admin portal</a>.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Waiver email error (non-fatal):', err.message);
  }
}

module.exports = { sendGiftCardEmail, sendBookingConfirmationEmail, sendBookingCancellationEmail, sendContactEnquiryEmail, sendWaiverEmail };
