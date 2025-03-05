const express = require('express');
const router = express.Router();
const middleware_auth = require('../middleware/auth');
const user_handler = require('../handlers/user_handler');
const message_handler = require('../handlers/message_handler');
const friend_handler = require('../handlers/friend_handler');
const validate_body = require('../middleware/validate_body');
const server_handler = require('../handlers/server_handler');

const v1 = express.Router();
//ログイン
v1.post('/login',validate_body, user_handler.login);
//新規登録
v1.post('/signup', validate_body, user_handler.signup);

// 認証後のエンドポイント
const auth = express.Router();
auth.use(middleware_auth.verify_token);

// ユーザー関連のエンドポイント
const user = express.Router();
user.get('/friendship',validate_body, friend_handler.friendship);

// サーバー関連のエンドポイント
const server = express.Router();
// サーバー作成
server.post('/create', validate_body, server_handler.create_server);

// チャンネル関連のエンドポイント
const channel = express.Router();
// メッセージ送信
channel.post('/create', validate_body, user_handler.createChannel);
channel.post('/message',validate_body, message_handler.send_message);


//　エンドポイントをマウント
server.use('/channel', channel);
auth.use('/user', user);
auth.use('/server', server);
v1.use('/auth', auth);

router.use('/v1', v1);

module.exports = router;