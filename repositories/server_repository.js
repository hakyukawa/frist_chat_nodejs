const pool = require('../config/database');
const { Channel } = require('../models/Channel');
const { Server } = require('../models/Server');
const utils = require('../utils/utils');

class server_repository {
    // サーバー作成
    async create_server(owner_id, server_id, server_name, until_reply, start_at, end_at, weeks, start_core_time, end_core_time) {
        const [result] = await pool.query('INSERT INTO server (SERVER_ID, OWNER_ID, SERVER_NAME, UNTIL_REPLY, START_AT, END_AT, WEEKS, START_CORE_TIME, END_CORE_TIME, CREATED_AT) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [server_id, owner_id, server_name, until_reply, start_at, end_at, weeks, start_core_time, end_core_time, utils.getCurrentDateTime()])
        if(result.affectedRows === 0) {
            return null;
        }
        return server_id;
    };

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
            console.log(server.server_id);
            const [server_info] = await pool.query(
                'SELECT server_id, server_name FROM server WHERE server_id = ?',
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

    async update_server_info (server_id, server_name, until_reply, start_at, end_at, weeks, start_core_time, end_core_time) {
        const query = `
            UPDATE server 
            SET server_name = ?, 
            until_reply = ?, 
            start_at = ?, 
            end_at = ?, 
            weeks = ?, 
            start_core_time = ?, 
            end_core_time = ?
            WHERE server_id = ?
        `;
        const[ updateData ] = await pool.query(query, [server_name, until_reply, start_at, end_at, weeks, start_core_time, end_core_time, server_id]);

        return updateData.affectedRows; // 更新された行数を返す
    }
}

module.exports = new server_repository();