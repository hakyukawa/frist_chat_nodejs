const server_repository = require('../repositories/server_repository');
const message_service = require('../services/message_service');
const server_handler = require('./server_handler');

// メッセージ処理
async function handle_message(ws, message, clients) {
    try {
        const data = JSON.parse(message);
        switch (data.type) {
            case 'chat_message':
                await handle_chat_message(ws, data, clients, global.user_info);
                break;
                
            case 'channel_state':
                channel_state(ws, data);
                break;

            default:
                console.log('未知のメッセージタイプ:', data.type);
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
async function handle_chat_message(ws, data, clients, user_info) {
    try {
        const user = user_info.get(ws.user_id);
        if(!user) return;
        const message_id = await message_service.send_message(ws.user_id,data.channel_id,data.message);

        await multicast_to_channel(data.channel_id, {
            type: 'chat_message',
            channel_id: data.channel_id,
            message: data.message,
            message_id: message_id,
            sender: {
                user_id: user.user_id,
                user_name: user.user_name,
                icon_url: user.icon_url
            },
            timestamp: new Date()
        }, clients);

        await channel_state_manager.updateAllActiveUsersReadStatus(data.channel_id, message_id);
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

const handle_status_update = (ws, data, clients, user_info) => {
    if (user_info.has(ws.user_id)) {
        const info = user_info.get(ws.user_id);
        info.status = data.status || 'online';
        user_info.set(ws.user_id, info);
        
        // ユーザーの所属チャンネルに新しいステータスをブロードキャスト
        const user_channels = server_handler.get_user_channel(ws.user_id);
        if (user_channels) {
            user_channels.forEach(channel_id => {
                multicast_to_channel(channel_id, {
                    type: 'user_status',
                    user_id: ws.user_id,
                    status: info.status,
                    timestamp: new Date()
                }, clients);
            });
        }
    }
}

// 切断処理
function handle_disconnect(user_id, clients, user_info) {
    clients.delete(user_id);
    
    if (user_info && user_info.has(user_id)) {
        const info = user_info.get(user_id);
        info.online = false;
        info.last_activity = new Date();
        user_info.set(user_id, info);
    }
}

// チャンネルへのマルチキャスト
async function multicast_to_channel(channel_id, message, clients) {
    console.log(`チャンネル ${channel_id} へのマルチキャスト:`, message);
    const user_ids = await server_repository.get_channel_member(channel_id);
    if (!user_ids) return;
    
    if(Array.isArray(user_ids)) {
        user_ids.forEach(user => {
            const user_id = user.user_id;
            // クライアントが接続していれば、メッセージを送信
            if (clients.has(user_id)) {
                const client = clients.get(user_id);
                client.send(JSON.stringify(message));
            }
        });
    }else{
        console.log('チャンネルメンバー取得エラー: user_idsが配列ではありません', user_ids);
    }
}

// 外部からのWebSocket通知送信用メソッド
function notify_new_message(message) {
    const clients = global.ws_clients;
    if (!clients) return false;
    
    multicast_to_channel(message.channel_id, {
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

    channel_state_manager.updateAllActiveUsersReadStatus(message.channel_id, message.message_id);
    
    return true;
}

// HTTP経由でのメッセージ編集をWSにも通知
function notify_edit_message(message) {
    const clients = global.ws_clients;
    if (!clients) return false;
    
    multicast_to_channel(message.channel_id, {
        type: 'edit_message',
        message: {
            message_id: message.message_id,
            channel_id: message.channel_id,
            sender_id: message.sender_id,
            content: message.content,
            edited_at: message.edited_at
        }
    }, clients);
    
    return true;
}

// チャンネル状態管理
const channel_state_manager = {
    activeUsers: new Map(),
    
    setActive(userId, channelId) {
        if (!this.activeUsers.has(channelId)) {
            this.activeUsers.set(channelId, new Set());
        }
        this.activeUsers.get(channelId).add(userId);

        // チャンネルがアクティブになったら既読状態を更新
        this.updateReadStatus(userId, channelId);
    },
    
    setInactive(userId, channelId) {
        if (this.activeUsers.has(channelId)) {
            this.activeUsers.get(channelId).delete(userId);
        }
    },
    
    getActiveUsers(channelId) {
        return this.activeUsers.has(channelId) ? 
            Array.from(this.activeUsers.get(channelId)) : [];
    },

    // 全てのアクティブユーザーの既読状態を更新
    async updateAllActiveUsersReadStatus(channel_id, message_id) {
        if (this.activeUsers.has(channel_id)) {
            const activeUsers = this.activeUsers.get(channel_id);
            const updatePromises = [];
            
            for (const userId of activeUsers) {
                updatePromises.push(server_repository.update_read_status(channel_id, user_id, message_id));
            }
            
            await Promise.all(updatePromises);
        }
    },

    // ユーザーの既読状態を更新
    async updateReadStatus(userId, channelId) {
        // 最新のメッセージIDを取得
        try {
            const lastMessageInfo = await message_service.get_last_message(channelId);
            if (lastMessageInfo && lastMessageInfo.message_id) {
                await server_repository.update_read_status(channelId, userId, lastMessageInfo.message_id);
            }
        } catch (error) {
            console.error('既読状態の更新に失敗しました:', error);
        }
    }
};

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
    multicast_to_channel,
    notify_new_message,
    notify_edit_message,
    channel_state
};