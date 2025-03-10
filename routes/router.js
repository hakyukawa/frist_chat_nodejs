const express = require('express');
const router = express.Router();
const middleware_auth = require('../middleware/auth');
const user_handler = require('../handlers/user_handler');
const message_handler = require('../handlers/message_handler');
const friend_handler = require('../handlers/friend_handler');
const validate_body = require('../middleware/validate_body');
const server_handler = require('../handlers/server_handler');
const { get } = require('http');

const v1 = express.Router();
v1.use(validate_body);
//ログイン
v1.post('/login',validate_body, user_handler.login);    // http://localhost:3001/api/v1/login
//新規登録
v1.post('/signup', validate_body, user_handler.signup);  // http://localhost:3001/api/v1/signup


// 認証後のエンドポイント
const auth = express.Router();
auth.use(middleware_auth.verify_token);

const user = express.Router();
//フレンド関係エンドポイント
//フレンド取得
user.get('/friendship', friend_handler.friendship);
//フレンドリクエスト作成
user.post('/friendrequest/:receiver_id', friend_handler.send_friendrequest )
//フレンドリクエスト取得
user.get('/friendrequest', friend_handler.get_friendrequest)
//フレンドリクエスト更新
user.put('/friendrequest/:status', friend_handler.res_friendrequest)
// ユーザー関連のエンドポイント
user.get('/profile', user_handler.get_profile);         // http://localhost:3001/api/v1/user/profile
user.put('/profile', user_handler.update_profile);
user.get('/items', user_handler.get_items);             // http://localhost:3001/api/v1/user/items
// ユーザー情報取得
user.get('/friendship', friend_handler.friendship);    // http://localhost:3001/api/v1/user/friendship
// サーバー関連のエンドポイント
const server = express.Router();
// サーバー設定
server.get('/:server_id', server_handler.get_server);
server.put('/:server_id', server_handler.update_server);
// サーバー作成
server.post('/', server_handler.create_server);    // http://localhost:3001/api/v1/server/
//サーバー一覧取得
server.get('/', server_handler.get_server_list);    // http://localhost:3001/api/v1/server/
// サーバーメンバー一覧
server.get('/members/:server_id', server_handler.get_server_members);
// サーバーメンバーではないフレンド一覧
server.get('/notmember/:server_id', server_handler.get_non_server_members);
//サーバー内の合計の未読件数、最終メッセージの時間、期限までの時間を返す
server.get('/count/:server_id', server_handler.get_server_unread_count);    // http://localhost:3001/api/v1/server/count/:server_id

// チャンネル関連のエンドポイント
const channel = express.Router();
// チャンネル一覧取得
channel.get('/:server_id', server_handler.get_channel_list)   // http://localhost:3001/api/v1/server/channel/
// チャンネル作成
channel.post('/', user_handler.createChannel);     // http://localhost:3001/api/v1/channel/
// チャンネル削除
channel.delete('/:channel_id', server_handler.delete_channel);    // http://localhost:3001/api/v1/channel/:channel_id
// メッセージ送信
channel.post('/message', message_handler.send_message);    // http://localhost:3001/api/v1/channel/message
// メッセージ編集
channel.put('/message/:message_id', message_handler.edit_message);     // http://localhost:3001/api/v1/channel/message/:message_id
// メッセージ取得
channel.get('/message/:channel_id', message_handler.get_message);    // http://localhost:3001/api/v1/channel/message/:channel_id
// 未読件数を更新
channel.put('/count/:channel_id', message_handler.update_unread_count);     // http://localhost:3001/api/v1/channel/count/:channel_id

//　エンドポイントをマウント
server.use('/channel', channel);
auth.use('/user', user);
auth.use('/server', server);
v1.use('/auth', auth);

router.use('/v1', v1);

module.exports = router;