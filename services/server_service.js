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

const get_server_list = async (user_id) => {
    try {
        const server_list = await server_repository.get_server_list(user_id);
        return {
            status: 200,
            message: 'サーバーを取得しました',
            data: server_list
        }
    } catch (err) {
        return {
            status: 500,
            message: `error: ${err}`
        }
    }
}

const get_channel_list = async (server_id) => {
    try {
        const channel_list = await server_repository.get_channel_list(server_id);
        return {
            status: 200,
            message: 'チャンネルを取得しました',
            data: channel_list
        }
    } catch (err) {
        return {
            status: 500,
            message: `error: ${err}`
        }
    }
}

module.exports = {
    create_server,
    get_server_list,
    get_channel_list
}