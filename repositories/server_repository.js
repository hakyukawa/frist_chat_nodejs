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
            throw error;
        }
    }

    async get_channel_byID(channel_id) {
        const [ result ] = pool.query('SELECT * FROM channel WHERE channel_id = ?', [ channel_id ]);

        if (result.length === 0) {
            return null;
        }

        const channelData = result[0];
        return new Channel (
            channelData.CHANNEL_ID,
            channelData.SERVER_ID,
            channelData.CHANNEL_NAME,
            channelData.CREATED_AT
        );
    }
}

module.exports = new server_repository();