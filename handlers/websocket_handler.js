const message_service = require('../services/message_service');
const state_manager = require('../ws/state_manager');

// メッセージ処理
async function handle_message(ws, message, clients) {
    try {
        const parsedMessage = JSON.parse(message);
        const user_id = ws.user_id;
        
        console.log(`ユーザーID ${user_id} からメッセージ受信:`, parsedMessage.type);
        
        switch (parsedMessage.type) {
            case 'chat_message':
                await handle_chat_message(ws, parsedMessage, clients);
                break;
                
            default:
                console.log('未知のメッセージタイプ:', parsedMessage.type);
                ws.send(JSON.stringify({
                    type: 'error',
                    error: 'unknown_message_type',
                    message: '不明なメッセージタイプです'
                }));
        }
    } catch (error) {
        console.error('メッセージ処理エラー:', error);
        ws.send(JSON.stringify({
            type: 'error',
            error: 'message_processing_error',
            message: 'メッセージの処理中にエラーが発生しました'
        }));
    }
}

// チャットメッセージ処理
async function handle_chat_message(ws, message_data, clients) {
    try {
        const user_id = ws.user_id;
        const { channel_id, content } = message_data;
        
        if (!channel_id || !content) {
            ws.send(JSON.stringify({
                type: 'error',
                error: 'invalid_message',
                message: 'channel_idまたはcontentが不足しています'
            }));
            return;
        }
        
        // message_serviceを利用してメッセージを保存
        const response = await message_service.send_message(user_id, channel_id, content);
        
        if (response.status !== 200) {
            ws.send(JSON.stringify({
                type: 'error',
                error: 'message_save_error',
                message: response.message || 'メッセージの保存に失敗しました'
            }));
            return;
        }
        
        // メッセージIDを取得
        const message_id = response.data;
        
        // チャンネルメンバーにメッセージをブロードキャスト
        malticast_to_channel(channel_id, {
            type: 'new_message',
            message: {
                message_id: message_id,
                channel_id: channel_id,
                sender_id: user_id,
                content: content,
                created_at: new Date().toISOString()
            }
        }, clients);
        
        // 送信確認をクライアントに送信
        ws.send(JSON.stringify({
            type: 'message_sent',
            message_id: message_id
        }));
        
    } catch (error) {
        console.error('メッセージ送信エラー:', error);
        ws.send(JSON.stringify({
            type: 'error',
            error: 'message_send_error',
            message: 'メッセージ送信処理中にエラーが発生しました'
        }));
    }
}

// 切断処理
function handle_disconnect(user_id, clients) {
    clients.delete(user_id);
    console.log(`ユーザーID ${user_id} が切断しました`);
}

// チャンネルへのマルチキャスト
function malticast_to_channel(channel_id, message, clients) {
    console.log(`チャンネル ${channel_id} へのマルチキャスト:`, message);
    const members = channel_members.get(channel_id) || new Set();
    members.forEach(user_id => {
        const ws = clients.get(user_id);
        if (!ws) return;

        const isActive = state_manager.isActive(user_id, channel_id);
        const message_type = isActive ? message.type : 'notification';

        ws.send(JSON.stringify({
            ...message,
            type: message_type,
            is_active: isActive
        }));
    });

}

// 外部からのWebSocket通知送信用メソッド
function notify_new_message(message) {
    const clients = global.ws_clients;
    if (!clients) return false;
    
    broadcast_to_channel(message.channel_id, {
        type: 'new_message',
        message: {
            message_id: message.message_id,
            channel_id: message.channel_id,
            sender_id: message.sender_id,
            content: message.content,
            created_at: message.created_at,
            edited_at: message.edited_at
        }
    }, clients);
    
    return true;
}

// HTTP経由でのメッセージ編集をWSにも通知
function notify_edit_message(message) {
    const clients = global.ws_clients;
    if (!clients) return false;
    
    broadcast_to_channel(message.channel_id, {
        type: 'edit_message',
        message: {
            message_id: message.message_id,
            channel_id: message.channel_id,
            sender_id: message.sender_id,
            content: message.content,
            edited_at: new Date().toISOString()
        }
    }, clients);
    
    return true;
}

const channel_members = new Map();

function channel_state(ws, message) {
    const { user_id } = ws;
    const { channel_id, state} = message;

    switch (state) {
        case 'active':
            channel_state_manager.setActive(user_id, channel_id);
            break;
        case 'inactive':
            channel_state_manager.setInactive(user_id, channel_id);
            break;
    }
}

module.exports = {
    handle_message,
    handle_disconnect,
    malticast_to_channel,
    notify_new_message,
    notify_edit_message,
    channel_state
};