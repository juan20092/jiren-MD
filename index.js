import { join, dirname } from 'path'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import cluster from 'cluster'
import { watchFile, unwatchFile } from 'fs'
import cfonts from 'cfonts'
import { createInterface } from 'readline'
import yargs from 'yargs'
import chalk from 'chalk'
import path from 'path'
import os from 'os'
import { promises as fsPromises } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(__dirname)
const { name, author } = require(join(__dirname, './package.json'))
const { say } = cfonts
const rl = createInterface(process.stdin, process.stdout)

say('Ji\nren\nBot', {
  font: 'block',
  align: 'center',
  gradient: ['red', 'white']
})
say(`Desarrolado por JuanMd`, {
  font: 'console',
  align: 'center',
  colors: ['cyan', 'magenta', 'yellow']
})

var isRunning = false

process.on('uncaughtException', (err) => {
  if (err.code === 'ENOSPC') {
    console.error('Se ha detectado ENOSPC (sin espacio o límite de watchers alcanzado), reiniciando....')
  } else {
    console.error('Error no capturado:', err)
  }
  process.exit(1)
})

async function start(file) {
  if (isRunning) return
  isRunning = true
  const currentFilePath = new URL(import.meta.url).pathname
  let args = [join(__dirname, file), ...process.argv.slice(2)]
  say([process.argv[0], ...args].join(' '), {
    font: 'console',
    align: 'center',
    gradient: ['red', 'magenta']
  })
  // Ensure workers get --expose-gc without confusing non-node launchers (e.g., ts-node)
  const wantFlag = '--expose-gc'
  // Avoid passing --expose-gc via execArgv to prevent non-node launchers (e.g., ts-node) from treating it as a module
  const workerExecArgv = process.execArgv.filter(arg => arg !== wantFlag)
  const envNodeOpts = process.env.NODE_OPTIONS || ''
  const hasFlagInEnv = envNodeOpts.split(/\s+/).includes(wantFlag)
  const workerEnv = { ...process.env, NODE_OPTIONS: hasFlagInEnv ? envNodeOpts : `${envNodeOpts} ${wantFlag}`.trim() }

  const setup = typeof cluster.setupPrimary === 'function' ? cluster.setupPrimary : cluster.setupMaster
  setup({
    exec: args[0],
    args: args.slice(1),
    execArgv: workerExecArgv,
  })
  let p = cluster.fork(workerEnv)
  p.on('message', data => {
    switch (data) {
      case 'reset':
        p.process.kill()
        isRunning = false
        start.apply(this, arguments)
        break
      case 'uptime':
        p.send(process.uptime())
        break
    }
  })

  p.on('exit', (_, code) => {
    isRunning = false
    console.error('⚠️ ERROR ⚠️ >> ', code)
    start('main.js')

    if (code === 0) return
    watchFile(args[0], () => {
      unwatchFile(args[0])
      start(file)
    })
  })

  const ramInGB = os.totalmem() / (1024 * 1024 * 1024)
  const freeRamInGB = os.freemem() / (1024 * 1024 * 1024)
  const packageJsonPath = path.join(path.dirname(currentFilePath), './package.json')
  try {
    const packageJsonData = await fsPromises.readFile(packageJsonPath, 'utf-8')
    const packageJsonObj = JSON.parse(packageJsonData)
    const currentTime = new Date().toLocaleString()
    let lineM = '⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ 》'
    console.log(chalk.yellow(`╭${lineM}
┊${chalk.blueBright('╭┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
┊${chalk.blueBright('┊')}${chalk.yellow(`🖥️ ${os.type()}, ${os.release()} - ${os.arch()}`)}
┊${chalk.blueBright('┊')}${chalk.yellow(`💾 Total RAM: ${ramInGB.toFixed(2)} GB`)}
┊${chalk.blueBright('┊')}${chalk.yellow(`💽 Free RAM: ${freeRamInGB.toFixed(2)} GB`)}
┊${chalk.blueBright('╰┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
┊${chalk.blueBright('╭┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
┊${chalk.blueBright('┊')} ${chalk.blue.bold(`🟢INFORMACIÓN :`)}
┊${chalk.blueBright('┊')} ${chalk.blueBright('┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')} 
┊${chalk.blueBright('┊')}${chalk.cyan(`👨🏻‍💻 Nombre: ${packageJsonObj.name}`)}
┊${chalk.blueBright('┊')}${chalk.cyan(`📲 Versión: ${packageJsonObj.version}`)}
┊${chalk.blueBright('┊')}${chalk.cyan(`🔗 Descripción: ${packageJsonObj.description}`)}
┊${chalk.blueBright('┊')}${chalk.cyan(`🐉 Project Author: ${packageJsonObj.author.name} (@xrljuan)`)}
┊${chalk.blueBright('┊')}${chalk.blueBright('┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')} 
┊${chalk.blueBright('┊')}${chalk.yellow(`🏓 Colaborador:`)}
┊${chalk.blueBright('┊')}${chalk.yellow(`• JUAN`)}
┊${chalk.blueBright('╰┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')} 
┊${chalk.blueBright('╭┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
┊${chalk.blueBright('┊')}${chalk.cyan(`⏰ Hora Actual :`)}
┊${chalk.blueBright('┊')}${chalk.cyan(`${currentTime}`)}
┊${chalk.blueBright('╰┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')} 
╰${lineM}`))
    setInterval(() => {}, 1000)
  } catch (err) {
    console.error(chalk.red(`❌ No se pudo leer el archivo package.json: ${err}`))
  }

  let opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
  if (!opts['test'])
    if (!rl.listenerCount()) rl.on('line', line => {
      p.emit('message', line.trim())
    })
}

start('main.js')
