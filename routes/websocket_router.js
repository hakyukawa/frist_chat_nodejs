const WebSocket = require('ws');
const middleware_auth = require('../middleware/auth');
const websocket_handler = require('../handlers/websocket_handler');
const server_handler = require('../services/server_handler');
const { URL } = require('url');


function setup_web_socket(server) {
    // WebSocketサーバー初期化
    const wss = new WebSocket.Server({
        server,
        path: '/api/v1/ws',
    });

    const clients = new Map();

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

            ws.user_id = user_id;
            ws.isAlive = true;
            
            const user_channels = server_handler.get_user_channel(user_id);

            // WebSocketクライアントを追加
            clients.set(user_id, ws);

            const user_channel = websocket_handler.get_user_channel(user_id);
            if (user_channel) {
                websocket_handler.malticast_to_channel(user_channel, {
                    type: 'connection',
                    status: 'success',
                    user_id: user_id,
                    message: 'WebSocket接続に成功しました'
                }, clients);
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
                websocket_handler.handle_isconnect(user_id, clients);
            });
        
        } catch (error) {
            console.error('認証エラー:', error);
            ws.close(4003, 'ws:認証に失敗しました');
        }
    });

    //接続維持用のping処理
    const interval =setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        })
    }, 30000)   // 30秒間隔

    wss.on('close', () => {
        clearInterval(interval);
    });

    // グローバル変数としてclientsを公開
    global.ws_clients = clients;

    return { wss, clients };
}

module.exports = setup_web_socket;