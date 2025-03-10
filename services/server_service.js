const e = require('express');
const server_repository = require('../repositories/server_repository');
const utils = require('../utils/utils');
const user_repository = require('../repositories/user_repository');
const friend_repository = require('../repositories/friend_repository');

// サーバー作成
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
// サーバー設定情報取得
const get_server = async (server_id, user_id) => {
    try {
        // サーバー情報の有無・サーバー情報取得
        const exiting_server = await server_repository.get_server_byID(server_id);
        if (!exiting_server) {
            return { 
                status: 404, 
                message: 'このサーバーは存在しません' 
            };
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
            weeks: utils.getActiveDaysFromBits(parseInt(exiting_server.weeks[0].toString(2).padStart(7, '0'), 2)),
            start_core_time: exiting_server.start_core_time,
            end_core_time: exiting_server.end_core_time,
            created_at: exiting_server.created_at,
            isOwner: exiting_server.owner_id === user_id
        };
    } catch (err) {
        return {
            status: 500,
            message: `error: ${err}`
        }
    }
}
// サーバーリスト
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
// チャンネルリスト
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
// サーバー設定情報更新
const update_server = async (server_id, server_name, until_reply, start_at, end_at, weeks, start_core_time, end_core_time) => {
    try {
        const updateServer = await server_repository.update_server_info(
            server_id,
            server_name,
            utils.formatTimeForMySQL(until_reply),
            utils.formatTimeForMySQL(start_at),
            utils.formatTimeForMySQL(end_at),
            utils.getBitsFromActiveDays(weeks),
            utils.formatTimeForMySQL(start_core_time),
            utils.formatTimeForMySQL(end_core_time)
        );
        if (!updateServer) {
            return {
                status: 404,
                message: 'データベースの更新に失敗しました'
            }
        }
        return {
            status: 200,
            message: 'データベースの更新に成功しました',
            update_info: updateServer
        }
    } catch (err) {
        return {
            status: 500, 
            message: `error: ${err}`
        }
    }
}

const get_server_members = async (server_id) => {
    try {
        // サーバー情報取得
        const server = await server_repository.get_server_byID(server_id);
        if (!server) {
            return { status: 404, message: 'このサーバーは存在しません' }
        }
        // サーバーのメンバー取得
        const server_members = await server_repository.get_server_members(server_id);
        if (!server_members) {
            return { status: 404, message: 'このサーバーにユーザーはいません' }
        }
        // オーナーが誰かどうか
        let owner_id = null;
        server_members.forEach((member) => {
            if (member.user_id === server.owner_id) {
                owner_id =  member.user_id;
            }
        });
        // メンバーのユーザーIDとユーザー名取得
        const members = await Promise.all(
            server_members.map((member) => user_repository.get_user_info(member.user_id))
        );
            
        return {
            status: 200,
            message: 'サーバーメンバー取得成功',
            server_id: server_id,
            owner: owner_id,
            members: members,
        }
    } catch (err) {
        return {
            status: 500,
            message: 'サーバーメンバーの取得に失敗しました',
            message: `error: ${err}`,
        }
    }
}

const get_non_server_members = async (user_id, server_id) => {
    try {
        // サーバー情報取得
        const server = await server_repository.get_server_byID(server_id);
        if (!server) {
            return { status: 404, message: 'このサーバーは存在しません' }
        }
        // friendship
        const user_friends = await friend_repository.get_friendID(user_id);
        if (!user_friends) {
            return { status: 404, message: 'フレンドはいません' }
        }
        //server_user
        const server_members = await server_repository.get_server_members(server_id);
        if (!server_members) {
            return { status: 404, message: 'このサーバーにユーザーはいません' }
        }

        let user_friendIDs = [];
        user_friends.forEach((friend) => {
            server_members.forEach((member) => {
                if (friend.user_id_1 !== member.user_id && friend.user_id_1 !== server.owner_id) {
                    user_friendIDs.push({user_id: friend.user_id_1});
                }
            });
        });

        const user_info = await Promise.all(
            user_friendIDs.map((friendID) => user_repository.get_user_info(friendID.user_id))
        );

        return {
            status: 200,
            message: 'サーバ未所属ユーザー情報取得成功',
            Non_members: user_info || [],
        }
        
    } catch (err) {
        return {
            status: 500,
            message: 'サーバー未所属メンバーの取得に失敗しました',
            message: `error: ${err}`,
        }
    }
}

module.exports = {
    create_server,
    get_server,
    update_server,
    get_server_list,
    get_channel_list,
    get_server_members,
    get_non_server_members,
}