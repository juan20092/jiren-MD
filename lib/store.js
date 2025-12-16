import { readFileSync, writeFileSync, existsSync } from 'fs'

// Import Baileys components properly
const baileys = await import('@whiskeysockets/baileys')
const { initAuthCreds, BufferJSON, proto } = baileys.default || baileys
 
function bind(conn) {
    if (!conn.chats) conn.chats = {}
    
    // Handler for contacts updates
    function updateNameToDb(contacts) {
        if (!contacts) return
        try {
            contacts = contacts.contacts || contacts
            for (const contact of contacts) {
                const id = conn.decodeJid(contact.id)
                if (!id || id === 'status@broadcast') continue
                let chatData = conn.chats[id]
                if (!chatData) chatData = conn.chats[id] = { ...contact, id }
                conn.chats[id] = {
                    ...chatData,
                    ...({
                        ...contact, id, ...(id.endsWith('@g.us') ?
                            { subject: contact.subject || contact.name || chatData.subject || '' } :
                            { name: contact.notify || contact.name || chatData.name || chatData.notify || '' })
                    } || {})
                }
            }
        } catch (e) {
            console.error('[store.js] Error in updateNameToDb:', e)
        }
    }
    
    conn.ev.on('contacts.upsert', updateNameToDb)
    conn.ev.on('contacts.set', updateNameToDb)
    conn.ev.on('chats.set', async ({ chats }) => {
        try {
            for (let { id, name, readOnly } of chats) {
                id = conn.decodeJid(id)
                if (!id || id === 'status@broadcast') continue
                const isGroup = id.endsWith('@g.us')
                let chatData = conn.chats[id]
                if (!chatData) chatData = conn.chats[id] = { id }
                chatData.isChats = !readOnly
                if (name) chatData[isGroup ? 'subject' : 'name'] = name
                if (isGroup) {
                    const metadata = await conn.groupMetadata(id).catch(err => {
                        console.error(`[store.js] Error fetching group metadata for ${id}:`, err?.message || String(err))
                        return null
                    })
                    if (metadata) {
                        if (name || metadata.subject) chatData.subject = name || metadata.subject
                        chatData.metadata = metadata
                    }
                }
            }
        } catch (e) {
            console.error('[store.js] Error in chats.set handler:', e)
        }
    })
    conn.ev.on('group-participants.update', async function updateParticipantsToDb({ id, participants, action }) {
        if (!id) return
        id = conn.decodeJid(id)
        if (id === 'status@broadcast') return
        if (!(id in conn.chats)) conn.chats[id] = { id }
        let chatData = conn.chats[id]
        chatData.isChats = true
        const groupMetadata = await conn.groupMetadata(id).catch(err => {
            console.error(`[store.js] Error fetching group metadata in participants update for ${id}:`, err?.message || String(err))
            return null
        })
        if (!groupMetadata) return
        chatData.subject = groupMetadata.subject
        chatData.metadata = groupMetadata
    })

    conn.ev.on('groups.update', async function groupUpdatePushToDb(groupsUpdates) {
        try {
            for (const update of groupsUpdates) {
                const id = conn.decodeJid(update.id)
                if (!id || id === 'status@broadcast') continue
                const isGroup = id.endsWith('@g.us')
                if (!isGroup) continue
                let chatData = conn.chats[id]
                if (!chatData) chatData = conn.chats[id] = { id }
                chatData.isChats = true
                
                // Update subject from the update event first
                if (update.subject) chatData.subject = update.subject
                
                // Fetch and update metadata
                const metadata = await conn.groupMetadata(id).catch(err => {
                    console.error(`[store.js] Error fetching group metadata in groups.update for ${id}:`, err?.message || String(err))
                    return null
                })
                if (metadata) {
                    chatData.metadata = metadata
                    // Use metadata subject as fallback
                    if (!update.subject && metadata.subject) chatData.subject = metadata.subject
                }
            }
        } catch (e) {
            console.error('[store.js] Error in groups.update handler:', e)
        }
    })
    conn.ev.on('chats.upsert', function chatsUpsertPushToDb(chatsUpsert) {
        try {
            const { id, name } = chatsUpsert
            if (!id || id === 'status@broadcast') return
            conn.chats[id] = { ...(conn.chats[id] || {}), ...chatsUpsert, isChats: true }
            const isGroup = id.endsWith('@g.us')
            if (isGroup && conn.insertAllGroup) {
                conn.insertAllGroup().catch(err => {
                    console.error('[store.js] Error in insertAllGroup:', err?.message || String(err))
                })
            }
        } catch (e) {
            console.error('[store.js] Error in chats.upsert handler:', e)
        }
    })
    conn.ev.on('presence.update', async function presenceUpdatePushToDb({ id, presences }) {
        try {
            const sender = Object.keys(presences)[0] || id
            const _sender = conn.decodeJid(sender)
            const presence = presences[sender]?.['lastKnownPresence'] || 'composing'
            let chatData = conn.chats[_sender]
            if (!chatData) chatData = conn.chats[_sender] = { id: sender }
            chatData.presences = presence
            if (id.endsWith('@g.us')) {
                let groupChatData = conn.chats[id]
                if (!groupChatData) groupChatData = conn.chats[id] = { id }
            }
        } catch (e) {
            console.error('[store.js] Error in presence.update handler:', e)
        }
    })
}

const KEY_MAP = {
    'pre-key': 'preKeys',
    'session': 'sessions',
    'sender-key': 'senderKeys',
    'app-state-sync-key': 'appStateSyncKeys',
    'app-state-sync-version': 'appStateVersions',
    'sender-key-memory': 'senderKeyMemory'
}

function useSingleFileAuthState(filename, logger) {
    let creds, keys = {}, saveCount = 0
    const saveState = (forceSave) => {
        logger?.trace('saving auth state')
        saveCount++
        if (forceSave || saveCount > 5) {
            try {
                writeFileSync(
                    filename,
                    JSON.stringify({ creds, keys }, BufferJSON.replacer, 2)
                )
                saveCount = 0
            } catch (err) {
                console.error('[store.js] Error saving auth state:', err)
            }
        }
    }

    if (existsSync(filename)) {
        try {
            const result = JSON.parse(
                readFileSync(filename, { encoding: 'utf-8' }),
                BufferJSON.reviver
            )
            creds = result.creds
            keys = result.keys
        } catch (err) {
            console.error('[store.js] Error reading auth state file:', err)
            creds = initAuthCreds()
            keys = {}
        }
    } else {
        creds = initAuthCreds()
        keys = {}
    }

    return {
        state: {
            creds,
            keys: {
                get: (type, ids) => {
                    const key = KEY_MAP[type]
                    return ids.reduce(
                        (dict, id) => {
                            let value = keys[key]?.[id]
                            if (value) {
                                if (type === 'app-state-sync-key') {
                                    value = proto.AppStateSyncKeyData.fromObject(value)
                                }

                                dict[id] = value
                            }

                            return dict
                        }, {}
                    )
                },
                set: (data) => {
                    for (const _key in data) {
                        const key = KEY_MAP[_key]
                        keys[key] = keys[key] || {}
                        Object.assign(keys[key], data[_key])
                    }

                    saveState()
                }
            }
        },
        saveState
    }
}
export default {
    bind,
    useSingleFileAuthState
}
