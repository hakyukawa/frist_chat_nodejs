const pool = require('../config/database');
const Message = require('../models/Message');
const utils = require('../utils/utils');

class message_repository{
    // メッセージの送信
    async send_message(user_id, channel_id, content) {
        const message_id = utils.generateUUID();
        const [result] = await pool.query('INSERT INTO message (message_id, channel_id, sender_id, content, edited_at,  created_at) VALUES (?, ?, ?, ?, ?, ?)', [message_id, channel_id, user_id, content, utils.getCurrentDateTime(), utils.getCurrentDateTime()]);
        if(result.affectedRows === 0) {
            return null;
        }
        return message_id;
    }

    // メッセージの送信者を取得
    async get_sender_id(message_id) {
        const [result] = await pool.query('SELECT sender_id FROM message WHERE message_id = ?', [message_id]);
        if(result.length === 0) {
            return null;
        }
        return result[0].sender_id;
    };

    // メッセージの編集
    async edit_message(message_id, content) {
        const [result] = await pool.query('UPDATE message SET content = ?, edited_at = ? WHERE message_id = ?', [content, utils.getCurrentDateTime(), message_id]);
        if(result.affectedRows === 0) {
            return null;
        }
        return message_id;
    };
}

module.exports = new message_repository();