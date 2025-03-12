const pool = require('../config/database');
const { Channel } = require('../models/Channel');
const { Server } = require('../models/Server');
const utils = require('../utils/utils');


class server_repository {
    // サーバー作成
    async create_server(owner_id, server_id, server_name, icon_url, until_reply, start_at, end_at, weeks, start_core_time, end_core_time) {
        try {
            const [result] = await pool.query('INSERT INTO server (SERVER_ID, OWNER_ID, SERVER_NAME, ICON_URL, UNTIL_REPLY, START_AT, END_AT, WEEKS, START_CORE_TIME, END_CORE_TIME, CREATED_AT) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [server_id, owner_id, server_name, icon_url, until_reply, start_at, end_at, weeks, start_core_time, end_core_time, utils.getCurrentDateTime()])
            if(result.affectedRows === 0) {
                return null;
            }
            return server_id;
        } catch (error) {
            console.error("insert_server_user Error:", error);
            return null;
        }
    };

    async insert_server_user(server_id, user_id, is_muted, last_activity, joined_at) {
        try {
            const [ result ] = await pool.query('INSERT INTO server_user (server_id, user_id, is_muted, last_activity, joined_at) VALUES (?, ?, ?, ?, ?)', [server_id, user_id, is_muted, last_activity, joined_at]);
            if(result.affectedRows === 0) {
                return null;
            }
            return result.affectedRows;
        } catch (error) {
            console.error("insert_server_user Error:", error);
            return null;
        }
    }

    async get_server_byID (server_id) {
        try {
            const [ result ] = await pool.query('SELECT * FROM server WHERE server_id = ?', [ server_id ]);

            if (result.length === 0) {
                return null;
            }
            const serverData = result[0];
            return new Server(
                serverData.SERVER_ID,
                serverData.OWNER_ID,
                serverData.SERVER_NAME,
                serverData.ICON_URL,
                serverData.UNTIL_REPLY,
                serverData.START_AT,
                serverData.END_AT,
                serverData.WEEKS,
                serverData.START_CORE_TIME,
                serverData.END_CORE_TIME,
                serverData.CREATED_AT
            );
        } catch (error) {
            return error;
        }
    }
    async get_server_list(user_id) {
        const [server_id] = await pool.query('SELECT server_id FROM server_user WHERE user_id = ?', [user_id]);
        if (server_id.length === 0) {
            return [];
        }

        const servers = [];
        for (const server of server_id) {
            const [server_info] = await pool.query(
                'SELECT server_id, server_name, icon_url FROM server WHERE server_id = ?',
                [server.server_id]
            );

            if (server_info.length > 0) {
                servers.push(server_info[0]);
            }
        }

        return servers;
    }

    async get_channel_list(server_id) {
        const [channels] = await pool.query(
            'SELECT channel_id, channel_name FROM channel WHERE server_id = ?',
            [server_id]
        );
        return channels;
    }

    async update_server_info (server_id, server_name, icon_url, until_reply, start_at, end_at, weeks, start_core_time, end_core_time) {
        const query = `
            UPDATE server 
            SET server_name = ?, 
            icon_url = ?,
            until_reply = ?, 
            start_at = ?, 
            end_at = ?, 
            weeks = ?, 
            start_core_time = ?, 
            end_core_time = ?
            WHERE server_id = ?
        `;
        const[ updateData ] = await pool.query(query, [server_name, icon_url, until_reply, start_at, end_at, weeks, start_core_time, end_core_time, server_id]);

        return updateData.affectedRows; // 更新された行数を返す
    }

    async get_server_members(server_id) {
        const [ server_members ] = await pool.query('SELECT user_id FROM server_user WHERE server_id = ?', [server_id]);
        if (server_members.length === 0) {
            return null;
        }

        return server_members;
    }

    async get_channel_member(channel_id) {
        const [ server ] = await pool.query('SELECT server_id FROM channel WHERE channel_id = ?', [channel_id]);
        if (server.length === 0) {
            return null;
        }
        const [channel_users] = await pool.query('SELECT user_id FROM server_user WHERE  server_id = ?', [server[0].server_id]);
        return channel_users;
    }

    async update_read_status(channel_id, user_id, last_channel_message_id) {
        const query = `
            INSERT INTO read_status (user_id, channel_id, last_read_message_id, last_viewed_at, unread_count)
            VALUES (?, ?, ?, NOW(), 0)
            ON DUPLICATE KEY UPDATE last_viewed_at = NOW(), last_read_message_id = ?, unread_count = 0
        `;
        const [result] = await pool.query(query, [user_id, channel_id, last_channel_message_id, last_channel_message_id]);
        return result.affectedRows > 0;
    }

    async get_last_message(channel_id, user_id) {
        const [result] = await pool.query('SELECT last_message_id, last_updated_at FROM read_status WHERE channel_id = ? AND user_id = ?', [channel_id, user_id]);
        if(result.length === 0) {
            return null;
        }
        return result[0];

    }

    async get_channel_unread_count(channel_id, user_id) {
        try {
            const [result] = await pool.query(`
                SELECT unread_count 
                FROM read_status 
                WHERE channel_id = ? AND user_id = ?
            `, [channel_id, user_id]);
            
            if (result.length === 0) {
                return [{ unread_count: 0 }]; // ユーザーがチャンネルをまだ読んでいない場合
            }
            
            return result;
        } catch (error) {
            console.error("get_channel_unread_count Error:", error);
            return [{ unread_count: 0 }];
        }
    }

    async delete_channel(channel_id) {
        try {
            await pool.query('DELETE FROM read_status WHERE channel_id = ?', [channel_id]);
            await pool.query('DELETE FROM message WHERE channel_id = ?', [channel_id]);
            const [result] = await pool.query('DELETE FROM channel WHERE channel_id = ?', [channel_id]);
        return result;
        } catch (error) {
            return error;
        }
    }

    async get_server_by_channel(channel_id) {
        try{
            const [rows] = await pool.query('SELECT server_id FROM channel WHERE channel_id = ?', [channel_id]);
            if(rows.length === 0){
                throw new Error("チャンネルが見つかりません");
            }
            const server_id = rows[0].server_id;
            const server = await this.get_server_byID(server_id);
            return server;
        } catch (error) {
            return error
        }
    }
}

module.exports = new server_repository();