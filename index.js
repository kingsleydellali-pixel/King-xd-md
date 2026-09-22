/**
 * ═══════════════════════════════════════════════
 *  KING-XD v6 - WhatsApp Bot
 *  Developed by KINGSLEY-XMD TECH
 *  Powered by Baileys + Express
 * ═══════════════════════════════════════════════
 */

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');

// ═══════════════════════════════════════════════
//  ⚙️  SESSION ID INPUT — PASTE YOUR SESSION ID HERE
// ═══════════════════════════════════════════════
const SESSION_ID = process.env.SESSION_ID || 'GOTHIC-MD:~eyJub2lzZUtleSI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiSUhRcm9aVVFLdnA0RlNteC9RTExZZG1OZWJTNVUzRmtYbzNGWk1RQThXbz0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiVWZTZkQrbXJOTEZ2MlkzaGxleldycTBWOWRGM0I5MFVYZ01zVXZKUm4wMD0ifX0sInBhaXJpbmdFcGhlbWVyYWxLZXlQYWlyIjp7InByaXZhdGUiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJrSjdoZjVoZFJLRVVLVGVWemJJMEhMOFBEYWdYS3JEeXFIZmx3Vjd0bEhjPSJ9LCJwdWJsaWMiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiI4S0FyaEdES3pxZUd5OUd6NmkrMnAwd1ZsbmlybXhXWkdrbmdiemNuT2hJPSJ9fSwic2lnbmVkSWRlbnRpdHlLZXkiOnsicHJpdmF0ZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6Im1Ja0hpUFdPaFhiUGlJbGExWlNUSjZURUhmMk14dkFsL2x6anROUzVWRVE9In0sInB1YmxpYyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IjFyOVRzdmNXYjRrOG9nSmhxeDFTbWw0OTlla3B6QXYzS1dGcWdyNU8rbU09In19LCJzaWduZWRQcmVLZXkiOnsia2V5UGFpciI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoia05wU20rd0JPbFQ2ZnlOSzRma3ZmNVZ2ZSs5bW1mczZibVY4YVpnTTFGYz0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiSFZQWkphSlNSMXcwMjIwMVBCcCtGbStuTDBWMlVWRncrblJ0UlowVTBrRT0ifX0sInNpZ25hdHVyZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6InVSZXNwb25QTmhNNGxyYmZhNURubms5Qm10eENDMUZwYzBCMXU1SGQ3bkh5aFFpTE1UYlRZNUNNVVFnZ2o1dmZEaXRYRUJhYlkzb21HazFSYTMva2pnPT0ifSwia2V5SWQiOjF9LCJyZWdpc3RyYXRpb25JZCI6MTUxLCJhZHZTZWNyZXRLZXkiOiJKMW9ObGljYXdxNFFsZ3JxUVNCTVJvTEtvMmM0ZUhNOEVYYlRSZ3lHVjNFPSIsInByb2Nlc3NlZEhpc3RvcnlNZXNzYWdlcyI6W10sIm5leHRQcmVLZXlJZCI6MzEsImZpcnN0VW51cGxvYWRlZFByZUtleUlkIjozMSwiYWNjb3VudFN5bmNDb3VudGVyIjowLCJhY2NvdW50U2V0dGluZ3MiOnsidW5hcmNoaXZlQ2hhdHMiOmZhbHNlfSwicmVnaXN0ZXJlZCI6dHJ1ZSwicGFpcmluZ0NvZGUiOiJBRkZCSEgyTiIsIm1lIjp7ImlkIjoiMjMzNTM1NTAyMDM2Ojc2QHMud2hhdHNhcHAubmV0IiwibGlkIjoiMTIyOTQ4MjAzNTkzOTE5Ojc2QGxpZCIsIm5hbWUiOiLilpHilpLilpPiloggS0lOR1NMRVktWE1EIFRFQ0gg4paI4paTIn0sImFjY291bnQiOnsiZGV0YWlscyI6IkNMbXZucFVDRVAyV3l0VUdHQUVnQUNnQSIsImFjY291bnRTaWduYXR1cmVLZXkiOiJDV3BGT1IxTjJoMmQzVFBRdTZKdjc5ZnZub1VQZWl3eVk3VDR4MHhnN1JBPSIsImFjY291bnRTaWduYXR1cmUiOiJzMVNoUEc0czZ4UVBoK3JOOXlwaFBZZHVaL2pLbjJQR3prWUpOMEQ2elpxUVBEeklJTktORzNzM3Q3UzdLcmdEZHdRVU1tMWs3TjQ5UE1UclEvb2pEUT09IiwiZGV2aWNlU2lnbmF0dXJlIjoieG9PMmpoS0lsSlNWYlpwMjZtV3N6R2E5QUJ4MUk3S2lVVEUvc1c5bmxNQnFwMW5MWCtwR0FkTDFCSit6My92QnR3M3JFWUFzM3dzTFlPd1RwWXdqalE9PSJ9LCJzaWduYWxJZGVudGl0aWVzIjpbeyJpZGVudGlmaWVyIjp7Im5hbWUiOiIyMzM1MzU1MDIwMzY6NzZAcy53aGF0c2FwcC5uZXQiLCJkZXZpY2VJZCI6MH0sImlkZW50aWZpZXJLZXkiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJCUWxxUlRrZFRkb2RuZDB6MEx1aWIrL1g3NTZGRDNvc01tTzArTWRNWU8wUSJ9fV0sInBsYXRmb3JtIjoiYW5kcm9pZCIsInJvdXRpbmdJbmZvIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiQ0FJSUVnZ04ifSwibGFzdEFjY291bnRTeW5jVGltZXN0YW1wIjoxNzkwMDg2MDI1LCJteUFwcFN0YXRlS2V5SWQiOiJBQUFBQUlFTCJ9';

// ═══════════════════════════════════════════════
//  BOT CONFIGURATION
// ═══════════════════════════════════════════════
const BOT_NAME = 'KING-XD v6';
const DEV = 'KINGSLEY-XMD TECH';
const PREFIX = '.';
const OWNER_NUMBER = process.env.OWNER_NUMBER || '233535502036';
const OWNER_NAME = process.env.OWNER_NAME || 'KINGSLEY-XMD TECH';
const MODE = process.env.MODE || 'public';
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════════
//  EXPRESS SERVER (for Render health checks)
// ═══════════════════════════════════════════════
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    bot: BOT_NAME,
    developer: DEV,
    uptime: process.uptime() + 's',
    time: moment().tz('Africa/Accra').format('YYYY-MM-DD HH:mm:ss'),
  });
});

app.listen(PORT, () => {
  console.log(`[KING-XD] Express server running on port ${PORT}`);
});

// ═══════════════════════════════════════════════
//  BAILEYS WHATSAPP CONNECTION
// ═══════════════════════════════════════════════
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_kingxd');
  const { version } = await fetchLatestBaileysVersion();

  const logger = pino({ level: 'silent' });

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    browser: Browsers.ubuntu('Chrome'),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
  });

  // ── Load session from SESSION_ID string if auth not yet saved ──
  if (!state.creds.registered && SESSION_ID && SESSION_ID !== 'PASTE_YOUR_SESSION_ID_HERE') {
    try {
      const decoded = Buffer.from(SESSION_ID, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      Object.assign(state.creds, parsed);
      sock.authState.creds = state.creds;
      console.log('[KING-XD] Session ID loaded successfully ✅');
    } catch (e) {
      console.log('[KING-XD] Session ID could not be parsed directly. Attempting alternative...');
      try {
        const json = JSON.parse(SESSION_ID);
        Object.assign(state.creds, json);
        sock.authState.creds = state.creds;
        console.log('[KING-XD] Session ID loaded from JSON ✅');
      } catch (e2) {
        console.log('[KING-XD] ❌ Invalid Session ID format. Please check your SESSION_ID.');
      }
    }
  }

  // ── Save credentials on update ──
  sock.ev.on('creds.update', saveCreds);

  // ── Connection update handler ──
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      console.log(`[KING-XD] ✅ ${BOT_NAME} connected to WhatsApp successfully!`);
      console.log(`[KING-XD] Developer: ${DEV}`);
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      console.log(`[KING-XD] Connection closed. Reason: ${reason}`);

      if (reason !== DisconnectReason.loggedOut) {
        console.log('[KING-XD] Reconnecting...');
        startBot();
      } else {
        console.log('[KING-XD] ❌ Logged out. Please provide a new Session ID.');
      }
    }
  });

  // ═══════════════════════════════════════════════
  //  MESSAGE HANDLER
  // ═══════════════════════════════════════════════
  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const pushName = msg.pushName || 'User';

    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      '';

    if (!body || !body.startsWith(PREFIX)) return;

    const args = body.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    console.log(`[KING-XD] Command: ${command} from ${pushName}`);

    // ═══════════════════════════════════════════
    //  MAIN MENU
    // ═══════════════════════════════════════════
    if (command === 'menu' || command === 'help') {
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      const time = moment().tz('Africa/Lagos').format('HH:mm:ss');
      const date = moment().tz('Africa/Lagos').format('dddd, DD MMMM YYYY');

      const menuText = `
╔══════════════════════════════════════╗
║   🤖  ${BOT_NAME}  🤖
║   Developer: ${DEV}
╚══════════════════════════════════════╝

👤 *User:* ${pushName}
⏰ *Time:* ${time}
📅 *Date:* ${date}
⏳ *Uptime:* ${hours}h ${minutes}m ${seconds}s
📊 *Mode:* ${MODE}

╔══════════════════════════════════════╗
║          📋 MAIN MENU 📋
╚══════════════════════════════════════╝

🔹 *GENERAL*
├ ${PREFIX}menu      → Show this menu
├ ${PREFIX}ping      → Check bot speed
├ ${PREFIX}alive     → Check if bot is alive
├ ${PREFIX}info      → Bot information
└ ${PREFIX}owner     → Contact owner

🔹 *GROUP MANAGEMENT*
├ ${PREFIX}tagall    → Tag all members
├ ${PREFIX}kick      → Remove a member
├ ${PREFIX}promote   → Make member admin
├ ${PREFIX}demote    → Remove admin
├ ${PREFIX}groupinfo → Group details
├ ${PREFIX}mute      → Mute group
└ ${PREFIX}unmute    → Unmute group

🔹 *FUN & UTILITY*
├ ${PREFIX}joke      → Random joke
├ ${PREFIX}quote     → Random quote
├ ${PREFIX}fact      → Random fact
├ ${PREFIX}weather   → Weather info
├ ${PREFIX}shorten   → Shorten a URL
└ ${PREFIX}qr        → Generate QR code

🔹 *MEDIA*
├ ${PREFIX}sticker   → Image to sticker
├ ${PREFIX}toimage   → Sticker to image
├ ${PREFIX}vv        → View-once revealer
└ ${PREFIX}download  → Download media

🔹 *OWNER COMMANDS*
├ ${PREFIX}broadcast → Send to all chats
├ ${PREFIX}restart   → Restart bot
├ ${PREFIX}setprefix → Change prefix
└ ${PREFIX}eval      → Execute code

╔══════════════════════════════════════╗
║  © ${DEV} — ${BOT_NAME}
╚══════════════════════════════════════╝
      `;

      await sock.sendMessage(from, { text: menuText }, { quoted: msg });
    }

    // ═══════════════════════════════════════════
    //  PING
    // ═══════════════════════════════════════════
    if (command === 'ping') {
      const start = Date.now();
      await sock.sendMessage(from, { text: '🏓 Pinging...' }, { quoted: msg });
      const end = Date.now();
      await sock.sendMessage(from, {
        text: `🏓 *Pong!*\n⚡ Speed: ${end - start}ms\n🤖 Bot: ${BOT_NAME}`,
      }, { quoted: msg });
    }

    // ═══════════════════════════════════════════
    //  ALIVE
    // ═══════════════════════════════════════════
    if (command === 'alive') {
      await sock.sendMessage(from, {
        text: `✅ *${BOT_NAME} is alive and kicking!*\n👨‍💻 Developer: ${DEV}\n⏳ Uptime: ${Math.floor(process.uptime())}s`,
      }, { quoted: msg });
    }

    // ═══════════════════════════════════════════
    //  INFO
    // ═══════════════════════════════════════════
    if (command === 'info') {
      await sock.sendMessage(from, {
        text: `🤖 *Bot Name:* ${BOT_NAME}\n👨‍💻 *Developer:* ${DEV}\n📦 *Platform:* Baileys\n⚙️ *Prefix:* ${PREFIX}\n📊 *Mode:* ${MODE}`,
      }, { quoted: msg });
    }

    // ═══════════════════════════════════════════
    //  OWNER
    // ═══════════════════════════════════════════
    if (command === 'owner') {
      await sock.sendMessage(from, {
        text: `👑 *Owner:* ${OWNER_NAME}\n📞 *Contact:* wa.me/${OWNER_NUMBER}\n🏢 *Developed by:* ${DEV}`,
      }, { quoted: msg });
    }

    // ═══════════════════════════════════════════
    //  JOKE
    // ═══════════════════════════════════════════
    if (command === 'joke') {
      const jokes = [
        'Why did the scarecrow win an award? Because he was outstanding in his field! 🌾',
        'I told my computer I needed a break, and it said "No problem, I\'ll go to sleep." 💤',
        'Why don\'t scientists trust atoms? Because they make up everything! ⚛️',
        'What do you call a fake noodle? An impasta! 🍝',
        'Why did the math book look so sad? Because it had too many problems. 📘',
      ];
      const joke = jokes[Math.floor(Math.random() * jokes.length)];
      await sock.sendMessage(from, { text: `😂 *Random Joke*\n\n${joke}` }, { quoted: msg });
    }

    // ═══════════════════════════════════════════
    //  QUOTE
    // ═══════════════════════════════════════════
    if (command === 'quote') {
      const quotes = [
        'The only way to do great work is to love what you do. — Steve Jobs',
        'In the middle of every difficulty lies opportunity. — Albert Einstein',
        'Success is not final, failure is not fatal: it is the courage to continue that counts. — Winston Churchill',
        'The future belongs to those who believe in the beauty of their dreams. — Eleanor Roosevelt',
      ];
      const quote = quotes[Math.floor(Math.random() * quotes.length)];
      await sock.sendMessage(from, { text: `💬 *Quote of the Moment*\n\n${quote}` }, { quoted: msg });
    }

    // ═══════════════════════════════════════════
    //  FACT
    // ═══════════════════════════════════════════
    if (command === 'fact') {
      const facts = [
        'Honey never spoils. Archaeologists have found 3,000-year-old honey in Egyptian tombs that was still edible. 🍯',
        'Octopuses have three hearts and blue blood. 🐙',
        'A day on Venus is longer than a year on Venus. 🪐',
        'Bananas are berries, but strawberries are not. 🍌',
        'The Eiffel Tower can grow taller in summer due to heat expansion. 🗼',
      ];
      const fact = facts[Math.floor(Math.random() * facts.length)];
      await sock.sendMessage(from, { text: `🧠 *Did You Know?*\n\n${fact}` }, { quoted: msg });
    }

    // ═══════════════════════════════════════════
    //  TAG ALL (Group only)
    // ═══════════════════════════════════════════
    if (command === 'tagall') {
      if (!from.endsWith('@g.us')) {
        return sock.sendMessage(from, { text: '❌ This command only works in groups.' }, { quoted: msg });
      }

      const groupMetadata = await sock.groupMetadata(from);
      const participants = groupMetadata.participants;

      let tagText = `📢 *${BOT_NAME} — Tag All*\n\n`;
      tagText += `*Group:* ${groupMetadata.subject}\n`;
      tagText += `*Members:* ${participants.length}\n\n`;

      participants.forEach((p) => {
        tagText += `└ @${p.id.split('@')[0]}\n`;
      });

      await sock.sendMessage(from, {
        text: tagText,
        mentions: participants.map((p) => p.id),
      }, { quoted: msg });
    }

    // ═══════════════════════════════════════════
    //  GROUP INFO
    // ═══════════════════════════════════════════
    if (command === 'groupinfo') {
      if (!from.endsWith('@g.us')) {
        return sock.sendMessage(from, { text: '❌ This command only works in groups.' }, { quoted: msg });
      }

      const meta = await sock.groupMetadata(from);
      await sock.sendMessage(from, {
        text: `📋 *Group Information*\n\n📛 *Name:* ${meta.subject}\n🆔 *ID:* ${from}\n👥 *Members:* ${meta.participants.length}\n📝 *Description:* ${meta.desc || 'No description'}\n📅 *Created:* ${moment(meta.creation * 1000).format('DD MMMM YYYY')}`,
      }, { quoted: msg });
    }
  });

  return sock;
}

// ═══════════════════════════════════════════════
//  START THE BOT
// ═══════════════════════════════════════════════
console.log('═══════════════════════════════════════');
console.log(`  🤖 ${BOT_NAME} — Starting...`);
console.log(`  👨‍💻 Developed by ${DEV}`);
console.log('═══════════════════════════════════════');

if (!SESSION_ID || SESSION_ID === 'PASTE_YOUR_SESSION_ID_HERE') {
  console.log('⚠️  WARNING: No SESSION_ID provided!');
  console.log('   Please paste your Session ID in index.js (line 18)');
  console.log('   or set the SESSION_ID environment variable.');
  console.log('═══════════════════════════════════════');
}

startBot().catch((err) => {
  console.error('[KING-XD] Fatal error:', err);
  process.exit(1);
});

// ═══════════════════════════════════════════════
//  GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════
process.on('SIGINT', () => {
  console.log('[KING-XD] Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[KING-XD] Terminating...');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('[KING-XD] Uncaught Exception:', err);
});
