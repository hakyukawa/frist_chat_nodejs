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
v1.post('/login',validate_body, user_handler.login);    //http://localhost:3000/api/v1/login
//新規登録
v1.post('/signup', validate_body, user_handler.signup);  //http://localhost:3000/api/v1/signup


// 認証後のエンドポイント
const auth = express.Router();
auth.use(middleware_auth.verify_token);
auth.use(validate_body);

const user = express.Router();
// ユーザー関連のエンドポイント
user.get('/profile', user_handler.get_profile);
user.get('/items', user_handler.get_items);
// ユーザー情報取得
user.get('/friendship', friend_handler.friendship);    //http://localhost:3000/api/v1/user/friendship

// サーバー関連のエンドポイント
const server = express.Router();
// サーバー作成
server.post('/create', server_handler.create_server);    //http://localhost:3000/api/v1/server/create

// チャンネル関連のエンドポイント
const channel = express.Router();
// チャンネル作成
channel.post('/create', user_handler.createChannel);     //http://localhost:3000/api/v1/channel/create
// メッセージ送信
channel.post('/message', message_handler.send_message);    //http://localhost:3000/api/v1/channel/message
channel.put('/message/:message_id', message_handler.edit_message);     //http://localhost:3000/api/v1/channel/message

//　エンドポイントをマウント
server.use('/channel', channel);
auth.use('/user', user);
auth.use('/server', server);
v1.use('/auth', auth);

router.use('/v1', v1);

module.exports = router;