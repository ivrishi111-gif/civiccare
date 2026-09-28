import 'dotenv/config';

// ---------------------------------------------------------------------------
// SMS provider abstraction.
//
// mock (DEFAULT / development):
//   Logs the message to the server console and lets the API return the OTP
//   to the client so you can test the full flow without any SMS provider.
//
// twilio (production):
//   Set in server/.env:
//     SMS_PROVIDER=twilio
//     TWILIO_ACCOUNT_SID=...
//     TWILIO_AUTH_TOKEN=...
//     TWILIO_FROM_NUMBER=+15551234567
//   Then the OTP is really sent by SMS and is NEVER returned to the client.
// ---------------------------------------------------------------------------
export async function sendSms(phone, message) {
  if (
    process.env.SMS_PROVIDER === 'twilio' &&
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER
  ) {
    try {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization:
              'Basic ' +
              Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64'),
          },
          body: `To=${encodeURIComponent(phone)}&From=${encodeURIComponent(
            process.env.TWILIO_FROM_NUMBER
          )}&Body=${encodeURIComponent(message)}`,
        }
      );
      if (!res.ok) throw new Error(`Twilio responded ${res.status}`);
      return { via: 'twilio' };
    } catch (e) {
      console.error('twilio sms failed:', e.message);
      return { via: 'mock', error: e.message };
    }
  }
  console.log(`[sms:mock] to ${phone}: ${message}`);
  return { via: 'mock' };
}
