const pool = require('../config/database');
const Server = require('../models/Server');
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
}

module.exports = new server_repository();