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
}

module.exports = new message_service();