import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import twilio from 'twilio';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_FILE = path.join(__dirname, 'sms-config.json');

// Helper to load persistent config
function loadConfig() {
  let fileConfig: any = {};
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      fileConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    } catch {}
  }
  return {
    fast2smsApiKey: fileConfig.fast2smsApiKey || process.env.FAST2SMS_API_KEY || '',
    twilioAccountSid: fileConfig.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID || '',
    twilioAuthToken: fileConfig.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN || '',
    twilioPhoneNumber: fileConfig.twilioPhoneNumber || process.env.TWILIO_PHONE_NUMBER || '',
  };
}

let config = loadConfig();

function saveConfig(newConfig: typeof config) {
  config = { ...config, ...newConfig };
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save sms-config.json:', err);
  }
}

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Health & Status Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasFast2SMS: Boolean(config.fast2smsApiKey),
    hasTwilio: Boolean(config.twilioAccountSid && config.twilioAuthToken && config.twilioPhoneNumber),
    timestamp: new Date().toISOString(),
  });
});

// Update SMS Gateway Settings from the Web UI
app.post('/api/config/sms', (req, res) => {
  try {
    const { fast2smsApiKey, twilioAccountSid, twilioAuthToken, twilioPhoneNumber } = req.body;
    const updated: any = {};
    if (fast2smsApiKey !== undefined) updated.fast2smsApiKey = fast2smsApiKey.trim();
    if (twilioAccountSid !== undefined) updated.twilioAccountSid = twilioAccountSid.trim();
    if (twilioAuthToken !== undefined) updated.twilioAuthToken = twilioAuthToken.trim();
    if (twilioPhoneNumber !== undefined) updated.twilioPhoneNumber = twilioPhoneNumber.trim();

    saveConfig(updated);

    console.log('✅ SMS Config updated! Fast2SMS active:', Boolean(config.fast2smsApiKey));

    return res.json({
      success: true,
      message: 'SMS gateway configuration saved and active!',
      hasFast2SMS: Boolean(config.fast2smsApiKey),
      hasTwilio: Boolean(config.twilioAccountSid && config.twilioAuthToken && config.twilioPhoneNumber),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Emergency SOS Dispatch Endpoint
app.post('/api/sos/send', async (req, res) => {
  try {
    const { contacts, latitude, longitude, accuracy, customNote } = req.body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ success: false, error: 'No contacts provided' });
    }

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, error: 'Location coordinates missing' });
    }

    const mapUrl = `https://maps.google.com/maps?daddr=${latitude},${longitude}`;
    const timestamp = new Date().toLocaleTimeString();
    const noteText = customNote ? ` Note: ${customNote}` : '';

    const alertMessage = 
      `EMERGENCY SOS ALERT! I need urgent help! Tap this link for direct directions to my live location: ${mapUrl} (GPS Accuracy: ~${Math.round(accuracy || 20)}m at ${timestamp})${noteText}`;

    console.log('\n========================================');
    console.log('🚨 DISPATCHING EMERGENCY SOS ALERT:');
    console.log('📍 Coordinates:', latitude, longitude);
    console.log('🗺️ Map Link:', mapUrl);
    console.log('👥 Recipients:', contacts.map(c => `${c.name} (${c.phone})`).join(', '));
    console.log('========================================\n');

    // 1. If Fast2SMS API Key is configured (Best for Indian Numbers)
    if (config.fast2smsApiKey) {
      const cleanNumbers = contacts
        .map(c => c.phone.replace(/[^0-9]/g, ''))
        .map(p => (p.length > 10 ? p.slice(-10) : p)) // Get 10-digit number
        .filter(p => p.length === 10);

      if (cleanNumbers.length > 0) {
        try {
          const fast2smsRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
            method: 'POST',
            headers: {
              'authorization': config.fast2smsApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              route: 'q',
              message: alertMessage,
              language: 'english',
              flash: 0,
              numbers: cleanNumbers.join(','),
            }),
          });

          const fast2smsData: any = await fast2smsRes.json();
          console.log('Fast2SMS response:', fast2smsData);

          if (fast2smsData.return) {
            return res.json({
              success: true,
              mode: 'fast2sms',
              message: `✅ Real cellular SMS delivered directly to ${cleanNumbers.join(', ')} via Fast2SMS!`,
              mapUrl,
            });
          } else {
            const apiMsg = Array.isArray(fast2smsData.message)
              ? fast2smsData.message.join(', ')
              : (fast2smsData.message || 'Fast2SMS dispatch failed');
            console.error('Fast2SMS API returned error:', apiMsg);
            return res.json({
              success: false,
              mode: 'fast2sms_error',
              message: `⚠️ Fast2SMS Notice: ${apiMsg}. (To send right now without paying, click the green "Send WhatsApp" or "Send SMS" button below!)`,
              mapUrl,
            });
          }
        } catch (fastErr: any) {
          console.error('Fast2SMS fetch error:', fastErr);
        }
      }
    }

    // 2. If Twilio credentials are configured
    if (config.twilioAccountSid && config.twilioAuthToken && config.twilioPhoneNumber) {
      try {
        const client = twilio(config.twilioAccountSid, config.twilioAuthToken);
        const results = await Promise.allSettled(
          contacts.map((contact: { name: string; phone: string }) => {
            let phone = contact.phone.trim();
            if (!phone.startsWith('+')) {
              phone = `+91${phone}`;
            }
            return client.messages.create({
              body: `🚨 ${alertMessage}`,
              from: config.twilioPhoneNumber,
              to: phone,
            });
          })
        );

        const successfulCount = results.filter(r => r.status === 'fulfilled').length;
        return res.json({
          success: true,
          mode: 'twilio',
          message: `✅ Real cellular SMS dispatched to ${successfulCount} of ${contacts.length} contacts via Twilio!`,
          details: results,
          mapUrl,
        });
      } catch (twErr: any) {
        console.error('Twilio dispatch error:', twErr);
      }
    }

    // 3. Simulation mode if no external SMS gateway is configured yet
    return res.json({
      success: true,
      mode: 'simulated',
      message: `Alert generated for ${contacts.map(c => c.name).join(', ')}! (No SMS Gateway connected yet. Use the 1-click WhatsApp or Phone SMS button below to send immediately, or connect Fast2SMS/Twilio in Settings).`,
      mapUrl,
      contactsAlerted: contacts.length,
    });
  } catch (error: any) {
    console.error('Failed to dispatch SOS alert:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while sending SOS',
    });
  }
});

// Setup Vite dev server middleware in dev mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🛡️ SafeWay SOS Server running at http://localhost:${PORT}`);
    console.log(`📡 Cellular SMS Gateway: Ready\n`);
  });
}

startServer();

