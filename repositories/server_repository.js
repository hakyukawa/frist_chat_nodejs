const pool = require('../config/database');
const ServerId = ('../dtos/server.js')
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

    async get_server_list(user_id) {
        console.log(user_id);
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
}

module.exports = new server_repository();