// Configuración global para el bot
import { readdirSync, unlinkSync, existsSync, promises as fs, rmSync } from 'fs'
import path from 'path'

global.owner = [
  ['51992474443', '𝐸𝑆𝐶𝐴𝑁𝑂𝑅 - 𝐶𝑅𝐸𝐴𝐷𝑂𝑅', true]
]

global.mods = []
global.prems = []

global.APIs = {
  fgmods: 'https://api-fgmods.ddns.net'
}

global.APIKeys = {
  'https://api-fgmods.ddns.net': 'fg-dylux'
}

global.packname = '𝐉𝐈𝐑𝐄𝐍 𝐁𝐎𝐓'
global.author = '𝐄𝐒𝐂𝐀𝐍𝐎𝐑'
global.wm = '𝐉𝐈𝐑𝐄𝐍 𝐁𝐎𝐓 - 𝐄𝐒𝐂𝐀𝐍𝐎𝐑'
global.botname = '𝐉𝐈𝐑𝐄𝐍 𝐁𝐎𝐓'

global.rcanal = {
  contextInfo: {
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: "120363376636081832@newsletter",
      serverMessageId: 100,
      newsletterName: '𝐉𝐈𝐑𝐄𝐍 𝐁𝐎𝐓 🔱'
    }
  }
}
