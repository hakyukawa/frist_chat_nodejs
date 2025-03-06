const message_repository = require('../repositories/message_repository');

class message_service {
    // メッセージの送信
    async send_message(user_id, channel_id, content) {
        if(!user_id || !channel_id || !content) {
            return {
                status: 400,
                message: 'ボディが不足しています'
            }
        }
        
        const response = await message_repository.send_message(user_id, channel_id, content);
        if(!response) {
            return {
                status: 500,
                message: 'メッセージの送信に失敗しました'
            }
        }
        return {
            status: 200,
            message: 'メッセージを送信しました',
            data: response
        }
    }

    // メッセージの編集
    async edit_message(user_id, message_id, content) {
        if(!user_id || !message_id || !content) {
            return {
                status: 400,
                message: 'ボディが不正です'
            }
        }
        // メッセージの送信者を確認
        const sender_id = await message_repository.get_sender_id(message_id);
        if(!sender_id) {    // メッセージが見つからなかった場合
            return {
                status: 404,
                message: 'メッセージが見つかりません'
            }
        }
        if(sender_id !== user_id) { // メッセージの送信者と編集者が違った場合
            return {
                status: 403,
                message: 'メッセージを編集する権限がありません'
            }
        }
        const [result] = await message_repository.edit_message(message_id, content);
        if(result.affectedRows === 0) {
            return {
                status: 500,
                message: 'メッセージの編集に失敗しました'
            }
        }
        return {
            status: 200,
            message: 'メッセージを編集しました'
        }
    }

    async get_message(channel_id, user_id) {
        if(!channel_id) {
            return {
                status: 400,
                message: 'パラメータが不足しています'
            }
        }

        try {
            //最後に読んだメッセージIDを取得
            const last_message_id = await message_repository.get_last_read_message_id(channel_id, user_id);

            //メッセージを取得
            const response = await message_repository.get_message(channel_id, last_message_id);
            if(response.length === 0) { //メッセージが存在していないが、取得に失敗していない場合(チャンネル初期状態)
                return {
                    status: 200,
                    message: 'メッセージがありませんが取得には成功しています'
                }
            } else if (!response) {
                return {
                    status: 500,
                    message: 'メッセージの取得に失敗しました'
                }
            }
            //既読状態を取得
            const unread_status = await message_repository.get_unread_status(user_id, channel_id);
            let result = null;
            if(response.length > 0) {
                unread_status.last_read_message_id = response[0].message_id;
                unread_status.last_message_id = response[response.length - 1].message_id;
                unread_status.unread_count = 0;
                // 既読状態を更新
                result = await message_repository.update_read_status(unread_status, user_id, channel_id);
            }
            return {
                status: 200,
                message: 'メッセージを取得しました',
                data: [
                    response,
                    unread_status
                ]
            }
        } catch (error) {
            console.error(error);
            return {
                status: 500,
                message: `error: ${error}`
            }
        }
    }
}

module.exports = new message_service();