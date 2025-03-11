const pool = require('../config/database');
const { Message, ReadStatus } = require('../models/Message');
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

    //メッセージを取得
    async get_message(channel_id, last_message_id) {
        try {
            const limit = 50;   //取得してくる件数
            let query = `SELECT * FROM message WHERE channel_id = ? `;
            const param = [channel_id];
            if (last_message_id) {
                query += `AND message_id < ? `;
                param.push(last_message_id);
            }
            query += `ORDER BY message_id DESC LIMIT ?`;
            param.push(limit);
            const [result] = await pool.query(query, param);
            if(result.length === 0) {
                return result;
            }
            const messages = [];
            for (const message of result) {
                messages.push(new Message(
                    message.message_id || message.MESSAGE_ID, 
                    message.channel_id || message.CHANNEL_ID, 
                    message.sender_id || message.SENDER_ID, 
                    message.content || message.CONTENT, 
                    message.edited_at || message.EDITED_AT, 
                    message.created_at || message.CREATED_AT
                ));
            }
            return messages;
        } catch (error) {
            console.error(error);
            return error;
        }
    }

    // 最新のメッセージIDを取得
    async get_last_read_message_id(channel_id, user_id) {
        const [result] = await pool.query('SELECT last_read_message_id FROM read_status WHERE channel_id = ? AND user_id = ?', [channel_id, user_id]);
        if(result.length === 0) {
            return null;
        }
        return result[0].last_read_message_id;
    }    

    // 既読状態を取得
    async get_unread_status(user_id, channel_id) {
        const query = `                
                SELECT 
                channel_id, 
                user_id, 
                last_read_message_id, 
                last_message_id,
                (
                    SELECT COUNT(*) 
                    FROM message m 
                    WHERE m.channel_id = r.channel_id 
                    AND m.message_id > r.last_read_message_id
                ) as unread_count,
                last_viewed_at,
                last_updated_at
            FROM read_status r
            WHERE channel_id = ? AND user_id = ?
        `;
        
        const [result] = await pool.query(query, [channel_id, user_id]);
        if(result.length === 0) {
            // 既読状態が存在しない場合は新規作成
            return new ReadStatus(channel_id, user_id, null, null, 0, null, null);
        }
        console.log(result[0]);

        return new ReadStatus(
            result[0].channel_id,
            result[0].user_id,
            result[0].last_read_message_id,
            result[0].last_message_id,
            result[0].unread_count,
            result[0].last_viewed_at,
            result[0].last_updated_at
        );
    }

    // 既読状態を更新
    async update_read_status(unread_status, user_id, channel_id) {
        try {
            const query = `
            UPDATE read_status
            SET last_read_message_id = ?,
                last_message_id = ?,
                unread_count = ?,
                last_updated_at = ?
            WHERE channel_id = ? AND user_id = ?
            `;

            const params = [
                unread_status.last_read_message_id,
                unread_status.last_message_id,
                0,
                utils.getCurrentDateTime(),
                channel_id,
                user_id
            ];

            await pool.query(query, params);
        } catch (error) {
            utils.logError(error, 'MessageRepository.updateReadStatus');
            throw error;
        }
    }

    //未読件数更新処理
    async update_unread_count(channel_id, last_message_id) {
        const [result] = await pool.query('UPDATE read_status SET unread_count = unread_count + 1, last_message_id = ? WHERE channel_id = ?', [last_message_id, channel_id]);
        return result;
    }
}

module.exports = new message_repository();