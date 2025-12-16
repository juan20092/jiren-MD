/*♡❀˖⁺. ༶🐻✨Este bot es oficialmente  de Juan MD🔪♡⛓ ⋆˙⊹❀♡
*.°•*.♡ ️ッ Prohibido  editar los creditos ☁✧•. • °
☆ Creador @Mdjuan
˚ ༘♡ ·˚꒰Gracias por usar nuestra bot꒱ ₊˚ˑ༄

⁣╱╱┏╮╱╱╱╱╱╱╱╱╱╱
╱╱┃┃╱╱┳╱┓┳╭┛┳┓
▉━╯┗━╮┃╱┃┣┻╮┣╱
▉┈┈┈┈┃┻┛┛┻╱┗┗┛
▉╮┈┈┈┃▔▔▔▔▔▔▔▔
╱╰━━━╯
*/

import { watchFile, unwatchFile } from 'fs' 
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import fs from 'fs'
import cheerio from 'cheerio'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone' 

//✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏

//BETA: Si quiere evitar escribir el número que será bot en la consola, agregué desde aquí entonces:
//Sólo aplica para opción 2 (ser bot con código de texto de 8 digitos)
global.botNumberCode = '' //Ejemplo: +573218138672
global.confirmCode = ''

//✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏

global.owner = [
  ['573223702049', '۪〬.࠭⤿ 👑 ⋅ 𝐉𝐮𝐚𝐧 𝗖𝗋𝖾𝖺𝖽𝗈𝗋', true],
];


//✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏
global.Sesion = 'Data/Sesiones','573223702049'
global.mods = ['573223702049']
global.suittag = ['573223702049'] 
global.prems = ['573223702049']

//✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏

global.libreria = 'Baileys'
global.baileys = 'V 6.7.9' 
global.languaje = 'Español'
global.vs = '2.2.0'
global.vsJB = '5.0'
global.nameqr = '𝔍𝒊𝒓𝒆𝒏 𝑩𝒐𝒕'
global.namebot = '𝔍𝒊𝒓𝒆𝒏 𝑩𝒐𝒕'
global.sessions = 'BotSession'
global.jadi = 'jadibts' 
global.NakanoJadibts = true

//✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏

global.packname = '𝔍𝒊𝒓𝒆𝒏 𝑩𝒐𝒕'
global.botname = '𝔍𝒊𝒓𝒆𝒏 𝑩𝒐𝒕'
global.wm = '© 𝑪𝒓𝒆𝒂𝒅𝒐𝒓 𝕵𝖚𝖆𝖓 ❄︎.'
global.wm3 = '⫹⫺  ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'
global.footer = global.wm
global.author = '𝐌𝐚𝐝𝐞 𝐁𝐲 𝕵𝖚𝖆𝖓 ❄︎'
global.dev = '© ⍴᥆ᥕᥱrᥱძ ᑲᥡ 𝕵𝖚𝖆𝖓 ❄︎'
global.textbot = '𝔍𝒊𝒓𝒆𝒏 𝑩𝒐𝒕'
global.etiqueta = '𝕵𝖚𝖆𝖓 ❄︎'
global.titulowm = 'Whatsapp Multi Device';
global.titulowm2 = 'Escanor-Bot Ai'
global.igfg = '@𝕵𝖚𝖆𝖓 ❄︎'
global.gt = '© ᥴrᥱᥲ𝗍ᥱძ ᑲᥡ 𝕵𝖚𝖆𝖓 ❄︎';
global.me = '𝕵𝖚𝖆𝖓 𝐭𝐮 𝐩𝐚𝐩𝐚𝐢 🫵😒';
global.listo = '*🍭 Aqui tiene*'

//✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏

global.namabot = '⫹⫺  ᴍᴅ'
global.v = '-'   
global.eror = "_ubo un error _"
global.lopr = "🅟"
global.lolm = "Ⓛ"
global.dmenut = "✦ ───『"
global.dmenub = "│➭" 
global.dmenub2 = "│乂"
global.dmenuf = "╰━━━━━━━━┈─◂"
global.cmenut = "⫹⫺ ───『"
global.cmenuh = "』─── ⬟"
global.cmenub = "│〆"
global.cmenuf = "╰━━━━━━━━┈─◂"
global.cmenua = "\n⌕ ❙❘❙❙❘❙❚❙❘❙❙❚❙❘❙❘❙❚❙❘❙❙❚❙❘❙❙❘❙❚❙❘ ⌕\n     "
global.dashmenu = "✧────···[ *Dashboard* ]···────✧"
global.htki = '––––––『'
global.htka = '』––––––'
global.htjava = "⫹⫺"
global.comienzo = "• • ◕◕════"
global.fin = " • •"


//✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏


// Owner : https://qu.ax/GsnnC.jpg

//✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏

global.moneda = 'Yenes'
global.banner = 'https://iili.io/FGLbil4.jpg'
global.avatar = 'https://iili.io/FGLd7up.jpg'

//✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏

global.channel = "https://whatsapp.com/channel/0029VbARAwbEgGfOsCN1T10V"
global.github = "https://github.com/juan20092"
global.gmail = "juanboli2009@gmail.com"
//✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏

global.pdoc = ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/msword", "application/pdf", "text/rtf"]

global.ch = {
ch1: '120363419404216418@newsletter', //Meliodas Bot
}

//✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏

global.BASE_API_DELIRIUS = "https://delirius-apiofc.vercel.app";
global.BASE_API_SKYNEX = "https://skynex.boxmine.xyz";

global.shizokeys = 'shizo';
global.MyApiRestBaseUrl = 'https://api.cafirexos.com';
global.MyApiRestApikey = 'BrunoSobrino';
global.fgkeysapi = "elrebelde21";
global.openai_org_id = 'org-3';
global.openai_key = 'sk-0';
global.keysZens = ['LuOlangNgentot', 'c2459db922', '37CC845916', '6fb0eff124', 'hdiiofficial', 'fiktod', 'BF39D349845E', '675e34de8a', '0b917b905e6f'];
global.keysxxx = keysZens[Math.floor(keysZens.length * Math.random())];
global.keysxteammm = ['29d4b59a4aa687ca', '5LTV57azwaid7dXfz5fzJu', 'cb15ed422c71a2fb', '5bd33b276d41d6b4', 'HIRO', 'kurrxd09', 'ebb6251cc00f9c63'];
global.keysxteam = keysxteammm[Math.floor(keysxteammm.length * Math.random())];
global.keysneoxrrr = ['5VC9rvNx', 'cfALv5'];
global.keysneoxr = keysneoxrrr[Math.floor(keysneoxrrr.length * Math.random())];
global.lolkeysapi = ['kurumi']; // ['BrunoSobrino_2']
global.itsrose = ['4b146102c4d500809da9d1ff'];

global.apis = 'https://delirius-apiofc.vercel.app';

global.APIs = {
  ryzen: 'https://api.ryzendesu.vip',
  ApiEmpire: 'https://api-brunosobrino.zipponodes.xyz',
  xteam: 'https://api.xteam.xyz',
  btz: 'https://api.betabotz.eu.org',
  dzx: 'https://api.dhamzxploit.my.id',
  lol: 'https://api.lolhuman.xyz',
  neoxr: 'https://api.neoxr.my.id',
  delirius: 'https://delirius-apiofc.vercel.app',
  zenzapis: 'https://api.zahwazein.xyz',
  akuari: 'https://api.akuari.my.id',
  akuari2: 'https://apimu.my.id',
  fgmods: 'https://api-fgmods.ddns.net',
  botcahx: 'https://api.botcahx.biz.id',
  ibeng: 'https://api.ibeng.tech/docs',
  rose: 'https://api.itsrose.site',
  popcat: 'https://api.popcat.xyz',
  xcoders: 'https://api-xcoders.site',
  vihangayt: 'https://vihangayt.me',
  erdwpe: 'https://api.erdwpe.com',
  xyroinee: 'https://api.xyroinee.xyz',
  nekobot: 'https://nekobot.xyz'
},
global.APIKeys = {
  'https://api.xteam.xyz': `${keysxteam}`,
  'https://api.lolhuman.xyz': 'GataDios',
  'https://api.betabotz.eu.org': 'APIKEY_KAMU',
  'https://api.neoxr.my.id': `${keysneoxr}`,
  'https://api.zahwazein.xyz': `${keysxxx}`,
  'https://api-fgmods.ddns.net': 'fg-dylux',
  'https://api.botcahx.biz.id': 'Admin',
  'https://api.fgmods.xyz': `${fgkeysapi}`,
  'https://api.ibeng.tech/docs': 'tamvan',
  'https://api.itsrose.site': 'Rs-Zeltoria',
  'https://api-xcoders.site': 'Frieren',
  'https://api.xyroinee.xyz': 'uwgflzFEh6'
};

//✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏

global.cheerio = cheerio
global.fs = fs
global.fetch = fetch
global.axios = axios
global.moment = moment   


global.multiplier = 69
global.maxwarn = '3'

//✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  import(`${file}?update=${Date.now()}`)
})
export default {
  owner: global.owner,
  mods: global.mods,
  suittag: global.suittag,
  prems: global.prems,
  libreria: global.libreria,
  baileys: global.baileys,
  languaje: global.languaje,
  vs: global.vs,
  vsJB: global.vsJB,
  nameqr: global.nameqr,
  namebot: global.namebot,
  sessions: global.sessions,
  jadi: global.jadi,
  MeliJadibts: global.MeliJadibts,
  packname: global.packname,
  botname: global.botname,
  wm: global.wm,
    wm3: global.wm3
  }
