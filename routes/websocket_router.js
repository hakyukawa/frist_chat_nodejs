const WebSocket = require('ws');
const middleware_auth = require('../middleware/auth');
const websocket_handler = require('../handlers/websocket_handler');
const server_handler = require('../handlers/server_handler');
const { URL } = require('url');
const user_repository = require('../repositories/user_repository');
const server_repository = require('../repositories/server_repository');


function setup_web_socket(server) {
    // WebSocketサーバー初期化
    const wss = new WebSocket.Server({
        server,
        path: '/api/v1/ws',
    });

    const clients = new Map();

    const user_info = new Map();

    // WebSocket接続イベント
    wss.on('connection', async (ws, req) => {
        console.log('WebSocket接続リクエスト受信');
        try {

            // URLからトークンを取得
            const url = new URL(req.url, `http://${req.headers.host}`);
            let token = url.searchParams.get('token');
            let token_from_header = null;

            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
                token_from_header = req.headers.authorization.split(' ')[1];
            }

            auth_token = token || token_from_header;

            if (!auth_token) {
                ws.close(4001, 'ws:認証トークンが見つかりません');
                return;
            }
            console.log('認証成功');

            // 認証トークンを検証
            const decoded = middleware_auth.decode_token(auth_token);
            const user_id = decoded.user_id;

            const user = await user_repository.get_user_profile(user_id);
            if (!user_id) {
                ws.close(4002, 'ws:認証トークンの検証中にエラーが発生しました');
                return;
            }

            ws.user_id = user_id;
            ws.isAlive = true;

            user_info.set(user_id, {
                user_id: user_id,
                user_name: user.user_name,
                user_image: user.user_image
            });
            const user_servers = await server_repository.get_server_list(user_id);
            let user_channels = [];
            if (user_servers && user_servers.length > 0) {
                //console.log(user_servers);
                // Promise.allを使って複数の非同期処理を並行実行
                const channelsPromises = user_servers.map(server => 
                    server_repository.get_channel_list(server.server_id)
                );
                const allChannels = await Promise.all(channelsPromises);
                
                // すべてのチャンネルを1つの配列にフラット化
                user_channels = allChannels.flat();
            }
            console.log(user_channels);

            // WebSocketクライアントを追加
            clients.set(user_id, ws);

            console.log(`WebSocket接続: ${user_id}`);
            // オンラインステータスの通知
            if (user_channels && user_channels.length > 0) {
                // 所属しているすべてのチャンネルにユーザーのオンライン状態を通知
                user_channels.forEach(channel => {
                    websocket_handler.multicast_to_channel(channel.channel_id, {
                        type: 'user_status',
                        user_id: user_id,
                        status: 'online',
                        timestamp: new Date()
                    }, clients);
                });
            }

            ws.send(JSON.stringify({
                type: 'connection',
                status: 'success',
                user_id: user_id,
                message: 'WebSocket接続に成功しました'
            }));

            // 接続状況をpingで維持
            ws.on('pong', () => {
                ws.isAlive = true;
                if (user_info.has(user_id)) {
                    const info = user_info.get(user_id);
                    info.last_activity = new Date();
                    user_info.set(user_id, info);
                }
            });

            //メッセージ受信処理
            ws.on('message', (message) => {
                try {
                    websocket_handler.handle_message(ws, message, clients);
                } catch (error) {
                    console.error('メッセージ処理エラー:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        error: 'message_processing_error',
                        message: 'メッセージ処理中にエラーが発生しました'
                    }));
                }
            });

            // クライアントの切断処理
            ws.on('close', () => {
                if (user_info.has(user_id)) {
                    const info = user_info.get(user_id);
                    info.online = false;
                    info.last_activity = new Date();
                    user_info.set(user_id, info);
                }
                websocket_handler.handle_disconnect(user_id, clients, user_info);
            });
        
        } catch (error) {
            console.error('認証エラー:', error);
            ws.close(4003, 'ws:認証に失敗しました');
        }
    });

    //接続維持用のping処理
    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                // ユーザー情報を更新
                if (ws.user_id && user_info.has(ws.user_id)) {
                    const info = user_info.get(ws.user_id);
                    info.online = false;
                    user_info.set(ws.user_id, info);
                }
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);   // 30秒間隔

    wss.on('close', () => {
        clearInterval(interval);
    });

    // グローバル変数としてclientsを公開
    global.ws_clients = clients;
    global.user_info = user_info;

    return { wss, clients, user_info };
}

module.exports = setup_web_socket;