/**
 * KING-XD v6
 * Developed by: KINGSLEY-XMD TECH
 * A high-performance WhatsApp bot using Baileys.
 *
 * -------------------------------------------------------------
 * HOW TO INPUT YOUR SESSION ID:
 *
 * OPTION 1 (Recommended for Render):
 *   1. In your Render Dashboard, go to your service.
 *   2. Click "Environment".
 *   3. Add a new variable:
 *        Key   = SESSION_ID
 *        Value = <paste your Base64 session string here>
 *   4. Deploy. The bot will connect automatically.
 *
 * OPTION 2 (Local / Manual):
 *   1. Find the line below:  const HARDCODED_SESSION_ID = "";
 *   2. Paste your session string between the quotes.
 *   3. Save and run `npm start`.
 * -------------------------------------------------------------
 */

const HARDCODED_SESSION_ID = ""; // <-- PASTE YOUR SESSION ID HERE IF NOT USING RENDER

const express = require('express');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    delay,
} = require('@whiskeysockets/baileys');

// ---------- Express server (for Render health checks & keep-alive) ----------
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('KING-XD v6 is running. Developed by KINGSLEY-XMD TECH.');
});

app.listen(PORT, () => {
    console.log(`[KING-XD v6] Express server running on port ${PORT}`);
});

// ---------- Session ID Input Logic ----------
const SESSION_ID = process.env.SESSION_ID || HARDCODED_SESSION_ID;

if (!SESSION_ID || SESSION_ID.trim() === "") {
    console.error(
        "[KING-XD v6] ❌ No Session ID found!\n" +
        "   -> Add it as an environment variable 'SESSION_ID' in Render, or\n" +
        "   -> Paste it into HARDCODED_SESSION_ID inside index.js."
    );
    process.exit(1);
}

// ---------- Bot Configuration ----------
const config = {
    botName: 'KING-XD v6',
    developer: 'KINGSLEY-XMD TECH',
    prefix: '.',
    ownerNumber: '233535502036', // Change to your number (international format, no +)
};

// ---------- Menu Definitions ----------
const menus = {
    general: {
        title: '📋 GENERAL',
        commands: [
            { cmd: 'menu', desc: 'Show the main menu' },
            { cmd: 'ping', desc: 'Check bot latency' },
            { cmd: 'info', desc: 'Bot information' },
            { cmd: 'owner', desc: 'Contact the developer' },
        ],
    },
    group: {
        title: '👥 GROUP',
        commands: [
            { cmd: 'kick', desc: 'Remove a member' },
            { cmd: 'promote', desc: 'Make user admin' },
            { cmd: 'demote', desc: 'Remove admin rights' },
            { cmd: 'tagall', desc: 'Mention everyone' },
        ],
    },
    media: {
        title: '🖼️ MEDIA',
        commands: [
            { cmd: 'sticker', desc: 'Convert image/video to sticker' },
            { cmd: 'toimage', desc: 'Convert sticker to image' },
            { cmd: 'vv', desc: 'Reveal view-once media' },
        ],
    },
    download: {
        title: '📥 DOWNLOAD',
        commands: [
            { cmd: 'play', desc: 'Download audio from YouTube' },
            { cmd: 'tiktok', desc: 'Download TikTok video' },
            { cmd: 'ig', desc: 'Download Instagram media' },
        ],
    },
    tools: {
        title: '🛠️ TOOLS',
        commands: [
            { cmd: 'getid', desc: 'Get your WhatsApp ID' },
            { cmd: 'device', desc: 'Show device info' },
            { cmd: 'runtime', desc: 'Bot uptime' },
        ],
    },
};

// ---------- Session Decoding & Storage ----------
async function decodeSession(sessionId) {
    const sessionDir = path.join(__dirname, 'auth_info_baileys');
    if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
    }
    fs.mkdirSync(sessionDir, { recursive: true });

    try {
        const decoded = Buffer.from(sessionId, 'base64').toString('utf-8');
        const creds = JSON.parse(decoded);
        fs.writeFileSync(
            path.join(sessionDir, 'creds.json'),
            JSON.stringify(creds, null, 2)
        );
        console.log('[KING-XD v6] ✅ Session decoded successfully.');
        return sessionDir;
    } catch (err) {
        console.error('[KING-XD v6] ❌ Failed to decode Session ID:', err.message);
        process.exit(1);
    }
}

// ---------- Connect to WhatsApp ----------
async function startBot() {
    const sessionDir = await decodeSession(SESSION_ID);

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ['KING-XD v6', 'Chrome', '1.0.0'],
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect =
                (lastDisconnect?.error)?.output?.statusCode !==
                DisconnectReason.loggedOut;
            console.log(
                `[KING-XD v6] Connection closed. Reconnecting: ${shouldReconnect}`
            );
            if (shouldReconnect) {
                setTimeout(() => startBot(), 3000);
            } else {
                console.log('[KING-XD v6] Logged out. Session cleared.');
            }
        } else if (connection === 'open') {
            console.log('[KING-XD v6] ✅ Connected to WhatsApp!');
            console.log('[KING-XD v6] Bot is ready for use.');
        }
    });

    // ---------- Message Handler & Commands ----------
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message) return;
        if (msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            '';
        const isGroup = from.endsWith('@g.us');

        if (!text.startsWith(config.prefix)) return;

        const args = text.slice(config.prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        const reply = (t) => sock.sendMessage(from, { text: t }, { quoted: msg });

        // ---------- MENU COMMANDS ----------
        switch (command) {
            case 'menu': {
                let menuText = `╭───「 *${config.botName}* 」───╮\n`;
                menuText += `│ Developer: ${config.developer}\n`;
                menuText += `│ Prefix: ${config.prefix}\n`;
                menuText += `│ Type: Multi-Device\n`;
                menuText += `╰──────────────────────╯\n`;

                for (const key in menus) {
                    const cat = menus[key];
                    menuText += `\n╭───「 ${cat.title} 」───╮\n`;
                    cat.commands.forEach((c) => {
                        menuText += `│ ${config.prefix}${c.cmd} — ${c.desc}\n`;
                    });
                    menuText += `╰──────────────────────╯`;
                }

                menuText += `\n\n_Developed by KINGSLEY-XMD TECH_`;
                await reply(menuText);
                break;
            }

            case 'ping': {
                const start = Date.now();
                await delay(100);
                await reply(`🏓 Pong! Latency: ${Date.now() - start}ms`);
                break;
            }

            case 'info': {
                await reply(
                    `*${config.botName}*\n` +
                    `Developer: ${config.developer}\n` +
                    `Version: 6.0.0\n` +
                    `Library: Baileys Multi-Device\n` +
                    `Status: ✅ Online`
                );
                break;
            }

            case 'owner': {
                await reply(
                    `👑 *Developer:* ${config.developer}\n` +
                    `📞 Contact: wa.me/${config.ownerNumber}`
                );
                break;
            }

            case 'getid': {
                await reply(`Your ID: ${sender}`);
                break;
            }

            case 'runtime': {
                const uptime = process.uptime();
                const h = Math.floor(uptime / 3600);
                const m = Math.floor((uptime % 3600) / 60);
                const s = Math.floor(uptime % 60);
                await reply(`⏱️ Uptime: ${h}h ${m}m ${s}s`);
                break;
            }

            case 'device': {
                await reply(
                    `📱 Device Info\n` +
                    `OS: ${process.platform}\n` +
                    `Node: ${process.version}\n` +
                    `Arch: ${process.arch}`
                );
                break;
            }

            // ---------- GROUP COMMANDS ----------
            case 'kick': {
                if (!isGroup) return reply('❌ This command is for groups only.');
                if (!msg.key.participant) {
                    return reply('❌ Could not identify sender.');
                }
                const mentioned =
                    msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
                if (!mentioned || mentioned.length === 0) {
                    return reply('❌ Tag a user to kick.');
                }
                await sock.groupParticipantsUpdate(from, mentioned, 'remove');
                await reply('✅ User(s) removed.');
                break;
            }

            case 'promote': {
                if (!isGroup) return reply('❌ This command is for groups only.');
                const mentioned =
                    msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
                if (!mentioned || mentioned.length === 0) {
                    return reply('❌ Tag a user to promote.');
                }
                await sock.groupParticipantsUpdate(from, mentioned, 'promote');
                await reply('✅ User(s) promoted to admin.');
                break;
            }

            case 'demote': {
                if (!isGroup) return reply('❌ This command is for groups only.');
                const mentioned =
                    msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
                if (!mentioned || mentioned.length === 0) {
                    return reply('❌ Tag a user to demote.');
                }
                await sock.groupParticipantsUpdate(from, mentioned, 'demote');
                await reply('✅ User(s) demoted.');
                break;
            }

            case 'tagall': {
                if (!isGroup) return reply('❌ This command is for groups only.');
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants;
                let tagText = '📢 *Attention Everyone:*\n\n';
                participants.forEach((p) => {
                    tagText += `@${p.id.split('@')[0]}\n`;
                });
                await sock.sendMessage(from, {
                    text: tagText,
                    mentions: participants.map((p) => p.id),
                });
                break;
            }

            // ---------- MEDIA COMMANDS ----------
            case 'sticker': {
                const quoted =
                    msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
                if (!quoted || !quoted.imageMessage) {
                    return reply('❌ Reply to an image to convert it to a sticker.');
                }
                try {
                    const media = await sock.downloadMediaMessage(
                        msg.message.extendedTextMessage.contextInfo.quotedMessage
                    );
                    const stickerBuffer = await new Sticker(media, {
                        pack: config.botName,
                        author: config.developer,
                    }).build();
                    await sock.sendMessage(from, { sticker: stickerBuffer });
                } catch (e) {
                    await reply('❌ Failed to create sticker.');
                }
                break;
            }

            case 'vv': {
                const quoted =
                    msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
                if (!quoted || !quoted.viewOnceMessage) {
                    return reply('❌ Reply to a view-once media to reveal it.');
                }
                const inner = quoted.viewOnceMessage.message;
                if (inner.imageMessage) {
                    const buffer = await sock.downloadMediaMessage(inner);
                    await sock.sendMessage(from, { image: buffer });
                } else if (inner.videoMessage) {
                    const buffer = await sock.downloadMediaMessage(inner);
                    await sock.sendMessage(from, { video: buffer });
                }
                break;
            }

            // ---------- DOWNLOAD COMMANDS ----------
            case 'play': {
                if (!args[0]) return reply('❌ Provide a song name. Usage: .play <song>');
                await reply(`🎵 Searching for "${args.join(' ')}"...`);
                // Placeholder: integrate your download API here.
                await reply('⚠️ Download feature requires an API key. Configure it to enable.');
                break;
            }

            case 'tiktok': {
                if (!args[0]) return reply('❌ Provide a TikTok URL.');
                await reply('📥 Downloading TikTok video...');
                // Placeholder for TikTok downloader.
                await reply('⚠️ TikTok download feature requires an API. Configure it to enable.');
                break;
            }

            case 'ig': {
                if (!args[0]) return reply('❌ Provide an Instagram URL.');
                await reply('📥 Downloading Instagram media...');
                // Placeholder for Instagram downloader.
                await reply('⚠️ Instagram download feature requires an API. Configure it to enable.');
                break;
            }

            default:
                // Silently ignore unknown commands
                break;
        }
    });
}

// ---------- Start ----------
startBot().catch((err) => {
    console.error('[KING-XD v6] Fatal error:', err);
});
