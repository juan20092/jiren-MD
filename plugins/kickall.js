let handler = async (m, { conn, participants, isBotAdmin, isOwner }) => {
    if (!m.isGroup) return
    
    const normJid = jid => jid.replace(/(@s\.whatsapp\.net|@lid)$/i, '')
    const autorizados = []
    const senderNorm = normJid(m.sender)
    
    if (!autorizados.includes(senderNorm) && !isOwner) {
        return m.reply('❌ *No tienes permiso para usar este comando*.')
    }

    if (!isBotAdmin) {
        return m.reply('❌ *El bot no es admin, no puede expulsar miembros*.')
    }

    const msg = await m.reply(`⚠️ *Este comando está diseñado para expulsar a todos los miembros del grupo* (excepto admins) *Usa el comando con precaución*

📌 *Solo reacciona con :*
「 ❤️ 」 Para hacer la expulsión
「 👎 」 Para cancelar la expulsión`)

    if (!global.kickallMessages) global.kickallMessages = new Map()
    global.kickallMessages.set(m.chat, msg.key.id)

    setTimeout(() => {
        if (global.kickallMessages.has(m.chat) && global.kickallMessages.get(m.chat) === msg.key.id) {
            global.kickallMessages.delete(m.chat)
            conn.sendMessage(m.chat, { text: '⏰ *Tiempo agotado. Expulsión cancelada automáticamente*.' })
        }
    }, 5 * 60 * 1000)
}

handler.before = async function (m, { conn, participants, isBotAdmin, isOwner }) {
    if (!m.isGroup || m.mtype !== 'reactionMessage') return
    
    const reaction = m.message.reactionMessage
    const key = reaction.key
    
    if (!global.kickallMessages || global.kickallMessages.get(m.chat) !== key.id) return
    
    const normJid = jid => jid.replace(/(@s\.whatsapp\.net|@lid)$/i, '')
    const autorizados = []
    const senderNorm = normJid(m.sender)
    
    if (!autorizados.includes(senderNorm) && !isOwner) return

    const botJid = conn.user.jid

    if (reaction.text === '❤️') {
        if (!isBotAdmin) return conn.sendMessage(m.chat, { text: '❌ *El bot necesita ser admin para expulsar*.' })

        const admins = participants.filter(p => p.admin).map(p => normJid(p.id))
        const expulsar = participants
            .filter(p => normJid(p.id) !== normJid(botJid) && !admins.includes(normJid(p.id)))
            .map(p => p.id)

        if (!expulsar.length) {
            return await conn.sendMessage(m.chat, { text: '✅ *No hay miembros para expulsar*.' })
        }

        try {
            await conn.sendMessage(m.chat, { text: `💣 *Adiós a* *${expulsar.length}* *miembros*.` })
            
            await conn.groupParticipantsUpdate(m.chat, expulsar, 'remove')
        } catch (e) {
            console.error('❌ *Hubo un error al expulsar:*', e)
            await conn.sendMessage(m.chat, { text: '⚠️ *Desafortunadamente WhatsApp bloqueó esta acción o hubo un error*.' })
        }
        global.kickallMessages.delete(m.chat)
    } else if (reaction.text === '👎') {
        await conn.sendMessage(m.chat, { text: '✅ *Expulsión cancelada*.' })
        global.kickallMessages.delete(m.chat)
    }
}

handler.help = ['kickall']
handler.tags = ['owner']
handler.command = /^kickall$/i
handler.group = true
handler.owner = true

export default handler
