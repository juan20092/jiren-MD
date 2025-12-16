import fs, { readdirSync, statSync, unlinkSync, existsSync, readFileSync, watch, mkdirSync, rmSync } from 'fs'
import path, { join } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'process'
import WebSocket from 'ws'
import yargs from 'yargs'
import chalk from 'chalk'
import syntaxerror from 'syntax-error'
import { tmpdir } from 'os'
import { format } from 'util'
import pino from 'pino'
import { Boom } from '@hapi/boom'
import { makeWASocket, protoType, serialize } from './lib/simple.js'
import { Low, JSONFile } from 'lowdb'
import lodash from 'lodash'
import readline from 'readline'
import NodeCache from 'node-cache'
import qrcode from 'qrcode-terminal'
import { spawn } from 'child_process'
import './config.js'
import { createRequire } from 'module'

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
process.env.TMPDIR = path.join(process.cwd(), 'tmp')

if (!fs.existsSync(process.env.TMPDIR)) {
  fs.mkdirSync(process.env.TMPDIR, { recursive: true })
}

const { proto } = (await import('@whiskeysockets/baileys')).default
const {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  makeCacheableSignalKeyStore,
  jidNormalizedUser
} = await import('@whiskeysockets/baileys')

const PORT = process.env.PORT || process.env.SERVER_PORT || 3000

protoType()
serialize()

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString()
}
global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true))
}
global.__require = function require(dir = import.meta.url) {
  return createRequire(dir)
}

global.API = (name, path = '/', query = {}, apikeyqueryname) =>
  (name in global.APIs ? global.APIs[name] : name) +
  path +
  (query || apikeyqueryname
    ? '?' +
      new URLSearchParams(
        Object.entries({
          ...query,
          ...(apikeyqueryname ? { [apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name] } : {})
        })
      )
    : '')

global.timestamp = { start: new Date() }

const __dirname = global.__dirname(import.meta.url)

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.prefix = new RegExp('^[#!./]')

global.db = new Low(new JSONFile(`storage/databases/database.json`))

global.DATABASE = global.db
global.loadDatabase = async function loadDatabase() {
  if (global.db.READ)
    return new Promise((resolve) =>
      setInterval(async function () {
        if (!global.db.READ) {
          clearInterval(this)
          resolve(global.db.data == null ? global.loadDatabase() : global.db.data)
        }
      }, 1 * 1000)
    )
  if (global.db.data !== null) return
  global.db.READ = true
  await global.db.read().catch(console.error)
  global.db.READ = null
  global.db.data = {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
    sticker: {},
    settings: {},
    ...(global.db.data || {})
  }
  global.db.chain = lodash.chain(global.db.data)
}

global.authFile = `sessions`
const { state, saveCreds } = await useMultiFileAuthState(global.authFile)

const { version } = await fetchLatestBaileysVersion()

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (texto) => new Promise((resolver) => rl.question(texto, resolver))

const logger = pino({
  timestamp: () => `,"time":"${new Date().toJSON()}"`
}).child({ class: 'client' })
logger.level = 'fatal'

function createConnectionOptions(authState, logger) {
  return {
    version,
    logger,
    printQRInTerminal: false,
    auth: {
      creds: authState.creds,
      keys: makeCacheableSignalKeyStore(authState.keys, logger)
    },
    browser: Browsers.ubuntu('Chrome'),
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
    retryRequestDelayMs: 10,
    transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 10 },
    maxMsgRetryCount: 15,
    appStateMacVerification: {
      patch: false,
      snapshot: false
    },
    getMessage: async () => ''
  }
}

const connectionOptions = createConnectionOptions(state, logger)

global.conn = makeWASocket(connectionOptions)
let conn = global.conn

global.conns = global.conns || []

let handler
try {
  const handlerModule = await import('./handler.js')
  handler = handlerModule.handler
} catch (e) {
  console.error(chalk.red('[ERROR] No se pudo cargar el handler principal:'), e)
  process.exit(1)
}

function setupSubBotEventHandlers(subBotConn, botPath, saveSubBotCreds) {
  subBotConn.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'open') {
      console.log(chalk.green(`Sub-bot conectado: ${path.basename(botPath)}`))
      const exists = global.conns.some((c) => c.user?.jid === subBotConn.user?.jid)
      if (!exists) {
        global.conns.push(subBotConn)
        console.log(chalk.green(`Sub-bot agregado: ${subBotConn.user?.jid}`))
      }
    } else if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.error(chalk.red(`Sub-bot desconectado: ${path.basename(botPath)} (${reason})`))
      
      if (reason === DisconnectReason.loggedOut || reason === 401) {
        console.log(chalk.red(`Eliminando sesión: ${path.basename(botPath)}`))
        global.conns = global.conns.filter((conn) => conn.user?.jid !== subBotConn.user?.jid)
        try {
          rmSync(botPath, { recursive: true, force: true })
          console.log(chalk.red(`Sesión eliminada: ${botPath}`))
        } catch (e) {
          console.error(chalk.red(`Error al eliminar sesión ${botPath}:`), e.message)
        }
      }
    }
  })
  
  subBotConn.ev.on('creds.update', saveSubBotCreds)
}

function setupSubBotHandler(subBotConn, handler) {
  const boundHandler = handler.bind(subBotConn)
  subBotConn.handler = async (upsert) => {
    try {
      const jid = upsert?.messages?.[0]?.key?.remoteJid
      if (jid) await subBotConn.sendPresenceUpdate('composing', jid).catch(() => {})
    } catch {}
    return boundHandler(upsert)
  }
  subBotConn.ev.on('messages.upsert', subBotConn.handler)
}

async function reconnectSubBot(botPath) {
  console.log(chalk.yellow(`Reconectando sub-bot: ${path.basename(botPath)}`))
  try {
    const { state: subBotState, saveCreds: saveSubBotCreds } = await useMultiFileAuthState(botPath)

    if (!subBotState.creds.registered) {
      console.warn(chalk.yellow(`Sub-bot no registrado: ${path.basename(botPath)}`))
      return
    }

    const subBotConn = makeWASocket(createConnectionOptions(subBotState, logger))

    setupSubBotEventHandlers(subBotConn, botPath, saveSubBotCreds)
    setupSubBotHandler(subBotConn, handler)

    if (!global.subBots) global.subBots = {}
    global.subBots[path.basename(botPath)] = subBotConn
    console.log(chalk.blue(`Sub-bot procesado: ${path.basename(botPath)}`))
  } catch (e) {
    console.error(chalk.red(`Error al reconectar sub-bot ${path.basename(botPath)}:`), e.message)
  }
}

async function startSubBots() {
  const rutaJadiBot = join(__dirname, './JadiBots')

  if (!existsSync(rutaJadiBot)) {
    mkdirSync(rutaJadiBot, { recursive: true })
    console.log(chalk.cyan(`Carpeta creada: ${rutaJadiBot}`))
  }

  const readRutaJadiBot = readdirSync(rutaJadiBot)
  if (readRutaJadiBot.length === 0) {
    console.log(chalk.gray(`No se encontraron sub-bots en ${rutaJadiBot}`))
    return
  }

  const credsFile = 'creds.json'
  console.log(chalk.magenta(`Iniciando reconexión de ${readRutaJadiBot.length} sub-bots`))
  
  for (const subBotDir of readRutaJadiBot) {
    const botPath = join(rutaJadiBot, subBotDir)
    try {
      if (!statSync(botPath).isDirectory()) {
        console.log(chalk.gray(`Ignorando archivo: ${subBotDir}`))
        continue
      }

      const readBotPath = readdirSync(botPath)
      if (readBotPath.includes(credsFile)) {
        console.log(chalk.magenta(`Reconectando: ${subBotDir}`))
        await reconnectSubBot(botPath)
      } else {
        console.log(chalk.yellow(`Sin creds.json: ${subBotDir}`))
      }
    } catch (e) {
      console.error(chalk.red(`Error procesando ${subBotDir}:`), e.message)
    }
  }
  console.log(chalk.magenta(`Reconexión de sub-bots completada`))
}

await startSubBots()

async function handleLogin() {
  if (conn.authState.creds.registered) {
    console.log(chalk.green('Sesión principal ya registrada.'))
    return
  }

  console.clear()

  console.log(`
${chalk.cyanBright('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓')}
${chalk.cyanBright('┃')} ${chalk.black.bgCyanBright.bold('   ⚡ MÉTODOS DE CONEXIÓN ⚡   ')} ${chalk.cyanBright('┃')}
${chalk.cyanBright('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛')}

${chalk.bold.cyan('Elige una opción')}
${chalk.cyanBright('╭──────────────────────────────────────────────────────╮')}
${chalk.cyanBright('│')} ${chalk.yellow.bold('1)')} ${chalk.greenBright('Código QR')}                             ${chalk.cyanBright('│')}
${chalk.cyanBright('│')} ${chalk.yellow.bold('2)')} ${chalk.greenBright('Código de emparejamiento')}              ${chalk.cyanBright('│')}
${chalk.cyanBright('╰──────────────────────────────────────────────────────╯')}

${chalk.dim('Tip: Si no puedes escanear el QR, usa el código de emparejamiento.')}
${chalk.dim('Recomendado para la primera configuración.')}
  `)

  let opcion = ''
  while (!/^[1-2]$/.test(opcion)) {
    opcion = await question(chalk.bgMagentaBright.black.bold(' Selecciona (1/2) ') + chalk.magentaBright(' ⇢ '))
    if (!/^[1-2]$/.test(opcion)) {
      console.log(chalk.bold.redBright('Opción no válida, por favor selecciona 1 o 2'))
    }
  }

  let loginMethod = opcion === '1' ? 'qr' : 'code'
  loginMethod = loginMethod.toLowerCase().trim()

  if (loginMethod === 'code') {
    let phoneNumber = await question(chalk.red('🔥 Ingresa el número de WhatsApp donde estará el bot (incluye código país, ej: 521XXXXXXXXXX):\n'))
    phoneNumber = phoneNumber.replace(/\D/g, '')

    if (phoneNumber.startsWith('52') && phoneNumber.length === 12) {
      phoneNumber = `521${phoneNumber.slice(2)}`
    } else if (phoneNumber.startsWith('52') && phoneNumber.length === 10) {
      phoneNumber = `521${phoneNumber.slice(2)}`
    } else if (phoneNumber.startsWith('0')) {
      phoneNumber = phoneNumber.replace(/^0/, '')
    }

    if (typeof conn.requestPairingCode === 'function') {
      try {
        if (conn.ws.readyState === WebSocket.OPEN) {
          let code = await conn.requestPairingCode(phoneNumber)
          code = code?.match(/.{1,4}/g)?.join('-') || code
          console.log(chalk.cyan('Tu código de emparejamiento es:', code))
        } else {
          console.log(chalk.red('La conexión principal no está abierta. Intenta nuevamente.'))
        }
      } catch (e) {
        console.log(chalk.red('Error al solicitar código de emparejamiento:'), e.message || e)
      }
    } else {
      console.log(chalk.red('Tu versión de Baileys no soporta emparejamiento por código.'))
    }
  } else {
    console.log(chalk.yellow('Generando código QR, escanéalo con tu WhatsApp...'))
    conn.ev.on('connection.update', ({ qr }) => {
      if (qr) qrcode.generate(qr, { small: true })
    })
  }
}

await handleLogin()

conn.isInit = false
conn.well = false

const DB_WRITE_INTERVAL = 30 * 1000 // 30 seconds
const AUTOCLEAR_AGE_MINUTES = 3

if (!opts['test']) {
  if (global.db) {
    setInterval(async () => {
      try {
        if (global.db.data) await global.db.write()
      } catch (e) {
        console.error(chalk.red('Error escribiendo base de datos:'), e.message)
      }
      
      if (opts['autocleartmp']) {
        const tmp = [tmpdir(), 'tmp', 'serbot']
        tmp.forEach((filename) => {
          try {
            spawn('find', [filename, '-amin', String(AUTOCLEAR_AGE_MINUTES), '-type', 'f', '-delete'])
          } catch (e) {
            // Ignore errors in cleanup
          }
        })
      }
    }, DB_WRITE_INTERVAL)
  }
}

const CLEANUP_INTERVAL = 3 * 60 * 1000 // 3 minutes
const FILE_MAX_AGE = 3 * 60 * 1000 // 3 minutes

function clearTmp() {
  const tmp = [join(__dirname, './tmp')]
  const filename = []
  tmp.forEach((dirname) => {
    try {
      readdirSync(dirname).forEach((file) => filename.push(join(dirname, file)))
    } catch (e) {
      // Directory might not exist
    }
  })
  return filename.map((file) => {
    try {
      const stats = statSync(file)
      if (stats.isFile() && Date.now() - stats.mtimeMs >= FILE_MAX_AGE) {
        unlinkSync(file)
        return true
      }
    } catch (e) {
      // File might have been deleted
    }
    return false
  })
}

setInterval(() => {
  if (global.stopped === 'close' || !conn || !conn.user) return
  try {
    clearTmp()
  } catch (e) {
    console.error(chalk.red('Error en limpieza de archivos temporales:'), e.message)
  }
}, CLEANUP_INTERVAL)

if (typeof global.gc === 'function') {
  const GC_INTERVAL = 5 * 60 * 1000 // 5 minutes
  setInterval(() => {
    try {
      global.gc()
      console.log(chalk.gray(`Recolección de basura ejecutada`))
    } catch (e) {
      console.error(chalk.red('Error en recolección de basura:'), e.message)
    }
  }, GC_INTERVAL)
} else {
  console.log(chalk.yellow(`Recolección de basura no disponible. Ejecuta Node.js con --expose-gc`))
}

async function connectionUpdate(update) {
  const { connection, lastDisconnect, isNewLogin } = update
  global.stopped = connection
  
  if (isNewLogin) conn.isInit = true
  
  const code = lastDisconnect?.error?.output?.statusCode || 
               lastDisconnect?.error?.output?.payload?.statusCode
  
  if (code && code !== DisconnectReason.loggedOut && conn?.ws.socket == null) {
    try {
      await global.reloadHandler(true)
      global.timestamp.connect = new Date()
    } catch (e) {
      console.error(chalk.red('Error en reloadHandler:'), e.message)
    }
  }
  
  if (global.db.data == null) {
    try {
      await loadDatabase()
    } catch (e) {
      console.error(chalk.red('Error cargando base de datos:'), e.message)
    }
  }
  
  if (connection === 'open') {
    console.log(chalk.yellow('Bot principal conectado'))
  }
  
  const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
  
  if (reason === 405) {
    try {
      if (existsSync('./sessions/creds.json')) unlinkSync('./sessions/creds.json')
    } catch (e) {
      console.error(chalk.red('Error eliminando creds.json:'), e.message)
    }
    console.log(chalk.redBright('Conexión reemplazada. Reiniciando...\nSi hay errores, reinicia con: npm start'))
    if (typeof process.send === 'function') process.send('reset')
  }
  
  if (connection === 'close') {
    switch (reason) {
      case DisconnectReason.badSession:
        conn.logger.error(`Sesión incorrecta, elimina ${global.authFile} y reconecta`)
        break
      case DisconnectReason.connectionClosed:
      case DisconnectReason.connectionLost:
      case DisconnectReason.timedOut:
        conn.logger.warn('Conexión perdida, reconectando...')
        try {
          await global.reloadHandler(true)
        } catch (e) {
          console.error(chalk.red('Error reconectando:'), e.message)
        }
        break
      case DisconnectReason.connectionReplaced:
        conn.logger.error('Conexión reemplazada, cierra la otra sesión primero')
        break
      case DisconnectReason.loggedOut:
        conn.logger.error(`Sesión cerrada, elimina ${global.authFile} y reconecta`)
        break
      case DisconnectReason.restartRequired:
        conn.logger.info('Reinicio requerido')
        try {
          await global.reloadHandler(true)
        } catch (e) {
          console.error(chalk.red('Error en reinicio:'), e.message)
        }
        break
      default:
        conn.logger.warn(`Desconexión: ${reason || 'desconocida'} - Estado: ${connection || 'N/A'}`)
        try {
          await global.reloadHandler(true)
        } catch (e) {
          console.error(chalk.red('Error en reconexión:'), e.message)
        }
        break
    }
  }
}

process.on('uncaughtException', (error) => {
  console.error(chalk.red('[UNCAUGHT EXCEPTION]'), error)
  if (error.code === 'ENOSPC') {
    console.error('Sin espacio en disco o límite de watchers alcanzado')
    process.exit(1)
  }
})

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('[UNHANDLED REJECTION]'), reason)
})

let isInit = true

global.reloadHandler = async function (restartConn) {
  try {
    const Handler = await import(`./handler.js?update=${Date.now()}`)
    if (Handler && Handler.handler) {
      handler = Handler.handler
    } else {
      throw new Error('Handler no encontrado en el módulo')
    }
  } catch (e) {
    console.error(chalk.red('[ERROR] No se pudo cargar handler.js:'), e.message)
    return false
  }

  if (restartConn) {
    try {
      if (global.conn.ws) global.conn.ws.close()
    } catch (e) {
      console.error(chalk.red('Error al cerrar conexión:'), e.message)
    }
    
    try {
      global.conn.ev.removeAllListeners()
    } catch (e) {
      console.error(chalk.red('Error al remover listeners:'), e.message)
    }
    
    global.conn = makeWASocket(connectionOptions)
    conn = global.conn
    isInit = true
  }

  if (!isInit) {
    conn.ev.off('messages.upsert', conn.handler)
    conn.ev.off('connection.update', conn.connectionUpdate)
    conn.ev.off('creds.update', conn.credsUpdate)
  }

  conn.handler = handler.bind(global.conn)
  const boundMainHandler = conn.handler
  conn.handler = async (upsert) => {
    try {
      const jid = upsert?.messages?.[0]?.key?.remoteJid
      if (jid) await conn.sendPresenceUpdate('composing', jid).catch(() => {})
    } catch {}
    return boundMainHandler(upsert)
  }
  conn.connectionUpdate = connectionUpdate.bind(global.conn)
  conn.credsUpdate = saveCreds.bind(global.conn, true)

  conn.ev.on('messages.upsert', conn.handler)
  conn.ev.on('connection.update', conn.connectionUpdate)
  conn.ev.on('creds.update', conn.credsUpdate)

  isInit = false
  return true
}

const pluginFolder = global.__dirname(join(__dirname, './plugins/index'))
const pluginFilter = (filename) => /\.js$/.test(filename)
global.plugins = {}

async function filesInit() {
  for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
    try {
      const file = global.__filename(join(pluginFolder, filename))
      const module = await import(file)
      global.plugins[filename] = module.default || module
    } catch (e) {
      conn.logger.error(`Error al cargar el plugin '${filename}': ${e}`)
      delete global.plugins[filename]
    }
  }
}
await filesInit()

global.reload = async (_ev, filename) => {
  if (!pluginFilter(filename)) return
  
  const dir = global.__filename(join(pluginFolder, filename), true)
  
  if (filename in global.plugins) {
    if (existsSync(dir)) {
      conn.logger.info(`Plugin actualizado: '${filename}'`)
    } else {
      conn.logger.warn(`Plugin eliminado: '${filename}'`)
      return delete global.plugins[filename]
    }
  } else {
    conn.logger.info(`Plugin nuevo: '${filename}'`)
  }

  const err = syntaxerror(readFileSync(dir), filename, {
    sourceType: 'module',
    allowAwaitOutsideFunction: true
  })
  
  if (err) {
    conn.logger.error(`Error de sintaxis en '${filename}':\n${format(err)}`)
  } else {
    try {
      const module = await import(`${global.__filename(dir)}?update=${Date.now()}`)
      global.plugins[filename] = module.default || module
    } catch (e) {
      conn.logger.error(`Error cargando plugin '${filename}':\n${format(e)}`)
    } finally {
      global.plugins = Object.fromEntries(
        Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b))
      )
    }
  }
}
Object.freeze(global.reload)

watch(pluginFolder, global.reload)
await global.reloadHandler()
