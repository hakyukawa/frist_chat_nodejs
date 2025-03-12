const e = require('express');
const server_repository = require('../repositories/server_repository');
const utils = require('../utils/utils');
const user_repository = require('../repositories/user_repository');
const friend_repository = require('../repositories/friend_repository');
const { error } = require('console');

// サーバー作成
const create_server = async (owner_id, server_name, icon_url, until_reply, start_at, end_at, weeks, start_core_time, end_core_time) => {
    const server_id = utils.generateUUID();
    try {
        const server = await server_repository.create_server(
            owner_id,
            server_id,
            server_name,
            icon_url,
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
        const server_user = await server_repository.insert_server_user(server_id, owner_id, false, utils.getCurrentDateTime(), utils.getCurrentDateTime());
        if (server_user === null) {
            return {
                status: 500,
                message: 'サーバーユーザーの登録に失敗しました'
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
            icon_url: exiting_server.icon_url,
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
const update_server = async (server_id, server_name, icon_url, until_reply, start_at, end_at, weeks, start_core_time, end_core_time) => {
    try {
        const updateServer = await server_repository.update_server_info(
            server_id,
            server_name,
            icon_url,
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
        console.log(user_friends);

        let user_friendIDs = [];

        user_friends.forEach((friend) => {
            // user_id_1 と user_id_2 の両方が server_members にいないか確認
            const isUser1Member = server_members.some(member => member.user_id === friend.user_id_1);
            const isUser2Member = server_members.some(member => member.user_id === friend.user_id_2);

            // `server_members` に存在しないユーザーだけを追加
            if (!isUser1Member && !user_friendIDs.some(u => u.user_id === friend.user_id_1)) {
                user_friendIDs.push({ user_id: friend.user_id_1 });
            }
            if (!isUser2Member && !user_friendIDs.some(u => u.user_id === friend.user_id_2)) {
                user_friendIDs.push({ user_id: friend.user_id_2 });
            }
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

const get_server_unread_count = async (server_id, user_id) => {
    try {
        //チャンネルIDの取得
        const channel_list = await server_repository.get_channel_list(server_id);
        if (!channel_list) {
            return { status: 404, message: 'チャンネルは存在しません' }
        }

        const server = await server_repository.get_server_byID(server_id);
        if (!server) {
            return { status: 404, message: 'このサーバーは存在しません' }
        }

        // Time型のuntil_reply（'00:30:00'形式）を分に変換
        const until_reply_time = server.until_reply;
        const [hours, minutes, seconds] = until_reply_time.split(':').map(Number);
        const until_reply_minutes = hours * 60 + minutes;
        //チャンネルの未読数を取得
        let total_unread_count = 0;
        let most_recent_message_time = null;

        // 各チャンネルを処理
        for (const channel of channel_list) {
            // このチャンネルの最後のメッセージ情報を取得
            const last_message = await server_repository.get_last_message(channel.channel_id, user_id);
            
            if (last_message && last_message.last_updated_at) {
                // このメッセージが全チャンネルで最新の場合、最新メッセージ時間を更新
                if (!most_recent_message_time || new Date(last_message.last_updated_at) > new Date(most_recent_message_time)) {
                    most_recent_message_time = last_message.last_updated_at;
                }
                
                // このチャンネルの未読数を取得して加算
                const unread_result = await server_repository.get_channel_unread_count(channel.channel_id, user_id);
                if (unread_result && unread_result.length > 0) {
                    total_unread_count += unread_result[0].unread_count;
                }
            }
        }
        
        // 返信期限までの残り時間を計算
        let minutes_remaining = null;
        let time_passed = null;
        let is_expired = false;
        
        if (most_recent_message_time) {
            const now = new Date();
            const message_time = new Date(most_recent_message_time);
            const elapsed_minutes = Math.floor((now - message_time) / (1000 * 60));
            
            time_passed = elapsed_minutes;
            minutes_remaining = until_reply_minutes - elapsed_minutes;
            
            // 期限切れかどうかを確認
            if (minutes_remaining <= 0) {
                minutes_remaining = 0;
                is_expired = true;
            }
        }
        
        return {
            status: 200,
            message: 'チャンネルの未読数を取得しました',
            unread_count: total_unread_count,
            most_recent_message_time: most_recent_message_time,
            until_reply: until_reply_time,
            until_reply_minutes: until_reply_minutes,
            time_passed: time_passed,
            minutes_remaining: minutes_remaining,
            is_expired: is_expired
        };

    } catch (err) {
        return {
            status: 500,
            message: 'チャンネルの未読数の取得に失敗しました',
            message: `error: ${err}`,
        }
    }
}

const add_non_server_member = async (server_id, user_id) => {
    try {
        const server_user = await server_repository.insert_server_user(server_id, user_id, false, utils.getCurrentDateTime(), utils.getCurrentDateTime());
        if (server_user === null) {
            return {
                status: 500,
                message: 'サーバーユーザーの登録に失敗しました'
            }
        }
        return {
            status: 200, 
            message: 'フレンドをサーバーに追加しました',
        }
    } catch (err) {
        return {
            status: 500,
            message: `サーバーにメンバー追加中にエラーが発生しました：${err}`,
        }
    }
}
  
const delete_channel = async (channel_id) => {
    try {
        const result = await server_repository.delete_channel(channel_id);
        if(result.length === 0) {
            return {
                status: 404,
                message: 'チャンネルは存在しません',
            }
        }
        return {
            status: 200,
            message: 'チャンネルを削除しました',
        };
    } catch (err) {
        return {
            status: 500,
            message: 'チャンネルの削除に失敗しました',
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
    get_server_unread_count,
    add_non_server_member,
    delete_channel
}