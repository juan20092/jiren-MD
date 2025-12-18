let handler = async (m, { conn, usedPrefix, command, participants, isAdmin, isBotAdmin }) => {
  // Protección antilid: solo admins pueden usar el comando
  if (!m.isGroup) return m.reply('🔱 𝐄𝐒𝐓𝐄 𝐂𝐎𝐌𝐀𝐍𝐃𝐎 𝐄𝐒 𝐒𝐎𝐋𝐎 𝐏𝐀𝐑𝐀 𝐆𝐑𝐔𝐏𝐎𝐒.\n> 𝐄𝐒𝐂𝐀𝐍𝐎𝐑 𝐁𝐎𝐓 🔱')
  if (!isAdmin && !m.key.fromMe) return m.reply('🔱 𝙴𝚂𝚃𝙴 𝙲𝙾𝙼𝙰𝙽𝙳𝙾 𝙴𝚂 𝚂𝙾𝙻𝙾 𝙿𝙰𝚁𝙰 𝙰𝙳𝙼𝙸𝙽𝙸𝚂𝚃𝚁𝙰𝙳𝙾𝚁𝙴𝚂.\n> 𝐄𝐒𝐂𝐀𝐍𝐎𝐑 𝐁𝐎𝐓 🔱')
  if (!isBotAdmin) return m.reply('🔱 𝒟𝐸𝐵𝒪 𝒮𝐸𝑅 𝒜𝒟𝑀𝐼𝒩 𝒫𝒜𝑅𝒜 𝐻𝒜𝒞𝐸𝑅 𝐸𝒮𝒪.\n> 𝐄𝐒𝐂𝐀𝐍𝐎𝐑 𝐁𝐎𝐓 🔱')

  // Obtener el usuario objetivo
  let target = (m.mentionedJid && m.mentionedJid[0]) || (m.quoted?.sender) || null
  if (!target) return m.reply(`⚜️ 𝐃𝐄𝐁𝐄𝐒 𝐌𝐄𝐍𝐂𝐈𝐎𝐍𝐀𝐑 𝐔𝐍 𝐔𝐒𝐔𝐀𝐑𝐈𝐎 𝐎 𝐑𝐄𝐒𝐏𝐎𝐍𝐃𝐄𝐑 𝐔𝐍 𝐌𝐄𝐍𝐒𝐀𝐉𝐄.\n> 𝐄𝐒𝐂𝐀𝐍𝐎𝐑 𝐁𝐎𝐓 🔱`)

  // No permitir kick al bot ni a admins ni al dueño del grupo
  const groupMetadata = await conn.groupMetadata(m.chat)
  const participantsData = groupMetadata.participants || []
  const botJid = conn.user?.jid || ''
  const owner = participantsData.find(p => p.admin === 'superadmin')
  const admins = participantsData.filter(p => ['admin', 'superadmin'].includes(p.admin)).map(p => p.id)

  if (target === botJid) return m.reply('⚠️ 𝐍𝐎 𝐏𝐔𝐄𝐃𝐎 𝐄𝐗𝐏𝐔𝐋𝐒𝐀𝐑𝐌𝐄 𝐀 𝐌𝐈 𝐌𝐈𝐒𝐌𝐎.\n> 𝐄𝐒𝐂𝐀𝐍𝐎𝐑 𝐁𝐎𝐓 🔱')
  if (admins.includes(target)) return m.reply('🚫 𝐍𝐎 𝐏𝐔𝐄𝐃𝐎 𝐄𝐗𝐏𝐔𝐋𝐒𝐀𝐑 𝐀 𝐎𝐓𝐑𝐎 𝐀𝐃𝐌𝐈𝐍 𝐍𝐈 𝐀𝐋 𝐂𝐑𝐄𝐀𝐃𝐎𝐑.\n> 𝐄𝐒𝐂𝐀𝐍𝐎𝐑 𝐁𝐎𝐓 🔱')

  try {
    await conn.groupParticipantsUpdate(m.chat, [target], 'remove')
    await conn.reply(m.chat, `✅ ᴜꜱᴜᴀʀɪᴏ @${target.split('@')[0]} 𝙴𝚇𝙿𝚄𝙻𝚂𝙰𝙳𝙾.\n> 𝐄𝐒𝐂𝐀𝐍𝐎𝐑 𝐁𝐎𝐓 🔱`, m, { mentions: [target] })
  } catch (e) {
    return m.reply(`❌ ᴇʀʀᴏʀ ᴀʟ ᴇxᴘᴜʟꜱᴀʀ: ${e?.message || e}\n> 𝐄𝐒𝐂𝐀𝐍𝐎𝐑 𝐁𝐎𝐓 🔱`)
  }
}

handler.help = ['kick @usuario', 'kick (responde a un mensaje)']
handler.tags = ['group']
handler.command = ['kick', 'ban', 'hechar']
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler
