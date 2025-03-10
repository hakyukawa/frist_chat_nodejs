const message_service = require('../services/message_service');
const websocket_handler = require('../handlers/websocket_handler');

//メッセージの送信
const send_message = async (req, res) => {
    const { channel_id, content } = req.body;
    const response = await message_service.send_message(req.user_id, channel_id, content);

    // WebSocket通知
    if (response.status === 200 && response.data) {
        websocket_handler.notify_new_message({
            message_id: response.data,
            channel_id: channel_id,
            sender_id: req.user_id,
            content: content,
            created_at: new Date().toISOString(),
            edited_at: null
        });
    }

    res.status(response.status).json(response);
};

//メッセージの編集
const edit_message = async (req, res) => {
    const { message_id } = req.params;
    const { content } = req.body;
    const response = await message_service.edit_message(req.user_id, message_id, content);

    // WebSocket通知
    if (response.status === 200 && response.data) {
        websocket_handler.notify_edit_message({
            message_id: message_id,
            channel_id: response.data.channel_id,
            sender_id: req.user_id,
            content: content,
            edited_at: new Date().toISOString()
        });
    }

    res.status(response.status).json(response);
};

//メッセージの取得
const get_message = async (req, res) => {
    const { channel_id } = req.params;
    const user_id = req.user_id;
    const response = await message_service.get_message(channel_id, user_id);
    res.status(response.status).json(response);
};

const update_unread_count = async (req, res) => {
    const response = await message_service.update_unread_count(req.params.channel_id, req.body.last_message_id);
    res.status(response.status).json(response);
};

module.exports = {
    send_message,
    edit_message,
    get_message,
    update_unread_count
};