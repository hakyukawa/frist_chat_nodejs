const server_repository = require('../repositories/server_repository');
const utils = require('../utils/utils');

const create_server = async (owner_id, server_name, until_reply, start_at, end_at, weeks, start_core_time, end_core_time) => {
    const server_id = utils.generateUUID();
    try {
        const server = await server_repository.create_server(
            owner_id,
            server_id,
            server_name,
            utils.formatTimeForMySQL(until_reply),
            utils.formatTimeForMySQL(start_at),
            utils.formatTimeForMySQL(end_at),
            utils.getBitsFromActiveDays(weeks),
            utils.formatTimeForMySQL(start_core_time),
            utils.formatTimeForMySQL(end_core_time)
        );
        if(!server) {
            return {
                status: 500,
                message: 'データベースに登録出来ませんでした'
            }
        }
        return {
            status: 200,
            message: 'サーバー作成完了',
            server_id: server.server_id
        }
    } catch (err) {
        return {
            status: 500,
            message: `サーバー作成中にエラーが発生しました : ${err}`
        }
    }
};

const get_server = async (server_id) => {
    // サーバー情報の有無・サーバー情報取得
    const exiting_server = await server_repository.get_server_byID(server_id);
    if (!exiting_server) {
        return { status: 404, message: 'サーバーが存在しません' };
    }

    return {
        status: 200,
        message: 'サーバーの情報取得成功',
        server_id: exiting_server.server_id,
        owner_id: exiting_server.owner_id,
        server_name: exiting_server.server_name,
        until_reply: exiting_server.until_reply,
        start_at: exiting_server.start_at,
        end_at: exiting_server.end_at,
        weeks: utils.getActiveDaysFromBits(exiting_server.weeks[0].toString(2)) || utils.getActiveDaysFromBits(0b0000000),
        start_core_time: exiting_server.start_core_time,
        end_core_time: exiting_server.end_core_time,
        created_at: exiting_server.created_at
    };
}

module.exports = {
    create_server,
    get_server,
}