const message_repository = require('../repositories/message_repository');

class message_service {
    // メッセージの送信
    async send_message(user_id, channel_id, content) {
        if(!user_id || !channel_id || !content) {
            return {
                status: 400,
                message: 'メッセージの送信に失敗しました'
            }
        }
        sender_
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
}

module.exports = new message_service();