/*♡❀˖⁺. ༶🐻✨ Converter Module - Jiren Bot 🔪♡⛓ ⋆˙⊹❀♡
*.°•*.♡ ️ッ Prohibido editar los creditos ☁✧•. • °
☆ Creador @Mdjuan
˚ ༘♡ ·˚꒰Gracias por usar nuestra bot꒱ ₊˚ˑ༄
*/

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import ffmpeg from 'fluent-ffmpeg'
import { promisify } from 'util'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

/**
 * Convierte datos entre diferentes formatos (JSON <-> Texto)
 * 
 * Esta función permite la conversión bidireccional entre JSON y texto plano.
 * Es útil para transformar configuraciones, respuestas de API o datos estructurados.
 * 
 * @param {string|object} data - Los datos a convertir (puede ser string JSON o objeto)
 * @param {string} targetFormat - El formato de destino ('json' o 'text')
 * @returns {string|object} - Los datos convertidos al formato especificado
 * 
 * @example
 * // Convertir objeto a JSON string
 * const jsonStr = convertData({ name: 'Jiren Bot' }, 'text')
 * 
 * @example
 * // Convertir JSON string a objeto
 * const obj = convertData('{"name":"Jiren Bot"}', 'json')
 */
export function convertData(data, targetFormat = 'json') {
    try {
        if (targetFormat === 'json') {
            // Convertir texto a JSON
            if (typeof data === 'string') {
                return JSON.parse(data)
            }
            // Si ya es objeto, devolverlo tal cual
            return data
        } else if (targetFormat === 'text') {
            // Convertir objeto/JSON a texto
            if (typeof data === 'object') {
                return JSON.stringify(data, null, 2)
            }
            // Si ya es texto, devolverlo tal cual
            return data
        } else {
            throw new Error(`Formato no soportado: ${targetFormat}. Use 'json' o 'text'.`)
        }
    } catch (error) {
        console.error('Error en convertData:', error.message)
        throw error
    }
}

/**
 * Convierte archivos de audio a formato MP3 usando FFmpeg
 * 
 * Esta función toma un archivo de audio en cualquier formato y lo convierte
 * a MP3 con configuraciones optimizadas para WhatsApp.
 * 
 * @param {Buffer|string} buffer - Buffer del archivo de audio o ruta al archivo
 * @param {string} ext - Extensión del archivo original (ej: 'ogg', 'wav', 'mp4')
 * @returns {Promise<{data: Buffer, filename: string}>} - Objeto con el buffer convertido y nombre del archivo
 * 
 * @example
 * // Convertir un archivo de audio a MP3
 * const converted = await toAudio(audioBuffer, 'ogg')
 * console.log(converted.filename) // 'audio_timestamp.mp3'
 */
export async function toAudio(buffer, ext) {
    return new Promise((resolve, reject) => {
        const tmpDir = path.join(__dirname, '../tmp')
        
        // Crear directorio temporal si no existe
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true })
        }
        
        const timestamp = Date.now()
        const inputPath = path.join(tmpDir, `input_${timestamp}.${ext}`)
        const outputPath = path.join(tmpDir, `output_${timestamp}.mp3`)
        
        try {
            // Escribir el buffer al archivo temporal
            const inputBuffer = Buffer.isBuffer(buffer) ? buffer : fs.readFileSync(buffer)
            fs.writeFileSync(inputPath, inputBuffer)
            
            // Convertir usando ffmpeg
            ffmpeg(inputPath)
                .toFormat('mp3')
                .audioCodec('libmp3lame')
                .audioBitrate('128k')
                .on('end', () => {
                    // Leer el archivo convertido
                    const convertedBuffer = fs.readFileSync(outputPath)
                    
                    // Limpiar archivos temporales
                    try {
                        fs.unlinkSync(inputPath)
                        fs.unlinkSync(outputPath)
                    } catch (cleanupError) {
                        console.error('Error al limpiar archivos temporales:', cleanupError)
                    }
                    
                    resolve({
                        data: convertedBuffer,
                        filename: `audio_${timestamp}.mp3`
                    })
                })
                .on('error', (error) => {
                    // Limpiar archivos en caso de error
                    try {
                        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
                        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
                    } catch (cleanupError) {
                        console.error('Error al limpiar archivos temporales:', cleanupError)
                    }
                    
                    reject(new Error(`Error al convertir audio: ${error.message}`))
                })
                .save(outputPath)
        } catch (error) {
            // Limpiar en caso de error inicial
            try {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
            } catch (cleanupError) {
                console.error('Error al limpiar archivos temporales:', cleanupError)
            }
            
            reject(error)
        }
    })
}

/**
 * Inicializa las configuraciones del bot desde un archivo JSON
 * 
 * Esta función carga y valida las configuraciones iniciales del bot.
 * Puede cargar desde un archivo específico o usar configuraciones por defecto.
 * 
 * @param {string} configPath - Ruta al archivo de configuración (opcional)
 * @returns {Promise<object>} - Objeto con las configuraciones cargadas
 * 
 * @example
 * // Cargar configuración desde archivo personalizado
 * const config = await initializeConfig('./config/bot-settings.json')
 * 
 * @example
 * // Cargar configuración por defecto
 * const config = await initializeConfig()
 */
export async function initializeConfig(configPath = null) {
    try {
        let config = {}
        
        // Si se proporciona una ruta, intentar cargar desde ese archivo
        if (configPath && fs.existsSync(configPath)) {
            const fileContent = await readFile(configPath, 'utf8')
            config = JSON.parse(fileContent)
            console.log(`✅ Configuración cargada desde: ${configPath}`)
        } else {
            // Cargar configuración por defecto desde config.js del proyecto
            const defaultConfigPath = path.join(__dirname, '../config.js')
            
            if (fs.existsSync(defaultConfigPath)) {
                // Para módulos ES6, importar dinámicamente
                // Nota: El cache-busting es necesario para recargar cambios en desarrollo
                const configModule = await import(`file://${defaultConfigPath}`)
                config = configModule.default || {}
                console.log('✅ Configuración por defecto cargada desde config.js')
            } else {
                // Configuración mínima de respaldo
                config = {
                    botname: '𝔍𝒊𝒓𝒆𝒏 𝑩𝒐𝒕',
                    version: '2.2.0',
                    prefix: '.',
                    owner: ['573223702049'],
                    language: 'es'
                }
                console.log('⚠️  Usando configuración mínima de respaldo')
            }
        }
        
        // Validar configuraciones esenciales
        if (!config.botname) {
            config.botname = '𝔍𝒊𝒓𝒆𝒏 𝑩𝒐𝒕'
        }
        
        if (!config.owner || !Array.isArray(config.owner)) {
            config.owner = ['573223702049']
        }
        
        // Añadir timestamp de inicialización
        config.initializedAt = new Date().toISOString()
        
        return config
    } catch (error) {
        console.error('❌ Error al inicializar configuración:', error.message)
        
        // Retornar configuración mínima en caso de error
        return {
            botname: '𝔍𝒊𝒓𝒆𝒏 𝑩𝒐𝒕',
            version: '2.2.0',
            prefix: '.',
            owner: ['573223702049'],
            language: 'es',
            error: error.message,
            initializedAt: new Date().toISOString()
        }
    }
}

/**
 * Maneja y estructura el procesamiento de comandos del bot
 * 
 * Esta función proporciona una estructura para procesar comandos recibidos,
 * validar permisos y ejecutar las acciones correspondientes.
 * 
 * @param {object} message - Objeto del mensaje recibido
 * @param {object} config - Configuración del bot
 * @returns {Promise<object>} - Resultado del procesamiento del comando
 * 
 * @example
 * // Procesar un comando
 * const result = await handleBotCommands(messageObject, botConfig)
 * if (result.success) {
 *   console.log('Comando ejecutado:', result.command)
 * }
 */
export async function handleBotCommands(message, config = {}) {
    try {
        // Estructura de respuesta por defecto
        const response = {
            success: false,
            command: null,
            action: null,
            data: null,
            error: null
        }
        
        // Validar que el mensaje existe
        if (!message || !message.text) {
            response.error = 'Mensaje inválido o vacío'
            return response
        }
        
        // Obtener el prefijo del comando (por defecto '.')
        const prefix = config.prefix || '.'
        const text = message.text.trim()
        
        // Verificar si el mensaje comienza con el prefijo
        if (!text.startsWith(prefix)) {
            response.error = 'El mensaje no contiene un comando válido'
            return response
        }
        
        // Extraer el comando y argumentos
        const args = text.slice(prefix.length).trim().split(/\s+/)
        const command = args.shift().toLowerCase()
        
        // Validar que existe un comando
        if (!command) {
            response.error = 'No se especificó ningún comando'
            return response
        }
        
        // Estructura del comando procesado
        response.command = command
        response.args = args
        response.prefix = prefix
        response.rawText = text
        
        // Verificar permisos de propietario para comandos sensibles
        const ownerCommands = ['eval', 'exec', 'ban', 'unban', 'broadcast']
        if (ownerCommands.includes(command)) {
            // Validar que message.sender existe
            if (!message.sender) {
                response.error = 'No se pudo verificar la identidad del remitente'
                response.requiresOwner = true
                return response
            }
            
            const isOwner = config.owner && Array.isArray(config.owner) && config.owner.includes(message.sender)
            
            if (!isOwner) {
                response.error = 'Este comando solo puede ser usado por el propietario del bot'
                response.requiresOwner = true
                return response
            }
        }
        
        // Determinar la acción según el comando
        switch (command) {
            case 'help':
            case 'menu':
                response.action = 'show_menu'
                response.data = {
                    type: 'menu',
                    message: 'Mostrando menú de ayuda'
                }
                response.success = true
                break
                
            case 'ping':
                response.action = 'ping'
                response.data = {
                    type: 'ping',
                    timestamp: Date.now()
                }
                response.success = true
                break
                
            case 'info':
                response.action = 'show_info'
                response.data = {
                    type: 'info',
                    botname: config.botname || '𝔍𝒊𝒓𝒆𝒏 𝑩𝒐𝒕',
                    version: config.version || '2.2.0'
                }
                response.success = true
                break
                
            case 'convert':
                response.action = 'convert_data'
                response.data = {
                    type: 'convert',
                    format: args[0] || 'json',
                    content: args.slice(1).join(' ')
                }
                response.success = true
                break
                
            default:
                response.action = 'unknown_command'
                response.error = `Comando desconocido: ${command}`
                response.suggestions = ['help', 'menu', 'ping', 'info']
                break
        }
        
        // Añadir metadata
        response.processedAt = new Date().toISOString()
        response.sender = message.sender
        
        return response
        
    } catch (error) {
        console.error('❌ Error en handleBotCommands:', error.message)
        
        return {
            success: false,
            command: null,
            action: null,
            data: null,
            error: error.message,
            processedAt: new Date().toISOString()
        }
    }
}

/**
 * Función auxiliar para validar formato de datos
 * 
 * Valida si un string es JSON válido
 * 
 * @param {string} str - String a validar
 * @returns {boolean} - true si es JSON válido, false en caso contrario
 */
export function isValidJSON(str) {
    try {
        JSON.parse(str)
        return true
    } catch (e) {
        return false
    }
}

/**
 * Función auxiliar para sanitizar datos
 * 
 * Limpia y sanitiza datos de entrada para prevenir inyecciones
 * 
 * @param {string} input - Datos de entrada a sanitizar
 * @returns {string} - Datos sanitizados
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return String(input)
    }
    
    // Remover caracteres potencialmente peligrosos
    let sanitized = input
        .replace(/[<>]/g, '') // Remover < y >
        .replace(/(?:javascript|data|vbscript|file|about|ftp|mailto|tel|sms):/gi, '') // Remover esquemas de URL peligrosos
        .trim()
    
    // Remover event handlers de forma iterativa con límite de seguridad
    let previousLength
    let iterations = 0
    const maxIterations = 10 // Prevenir loops infinitos
    
    do {
        previousLength = sanitized.length
        sanitized = sanitized.replace(/on\w+\s*=/gi, '')
        iterations++
    } while (sanitized.length !== previousLength && iterations < maxIterations)
    
    return sanitized
}

// Exportar todas las funciones como default también
export default {
    convertData,
    toAudio,
    initializeConfig,
    handleBotCommands,
    isValidJSON,
    sanitizeInput
}
