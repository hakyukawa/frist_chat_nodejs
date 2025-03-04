const pool = require('../config/database');
const Message = require('../models/Message');
const utils = require('../utils/utils');

class message_repository{
    async send_message(user_id, channel_id, content) {
        const message_id = utils.generateUUID();
        const [result] = await pool.query('INSERT INTO message (message_id, channel_id, sender_id, content, edited_at,  created_at) VALUES (?, ?, ?, ?, ?, ?)', [message_id, channel_id, user_id, content, utils.getCurrentDateTime(), utils.getCurrentDateTime()]);
        if(result.affectedRows === 0) {
            return null;
        }
        return message_id;
    }
}

module.exports = new message_repository();