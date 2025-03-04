const express = require('express');
const router = express.Router();
const middleware_auth = require('../middleware/auth');
const user_handler = require('../handlers/user_handler');
const message_handler = require('../handlers/message_handler');
const validate_body = require('../middleware/validate_body');

const v1 = express.Router();
//ログイン
v1.post('/login',validate_body, user_handler.login);
v1.post('/signup', validate_body, user_handler.signup);

// 認証後のエンドポイント
const auth = express.Router();
auth.use(middleware_auth.verify_token);

// ユーザー関連のエンドポイント
const user = express.Router();
user.post('/message',validate_body, message_handler.send_message);

//　エンドポイントをマウント
auth.use('/user', user);
v1.use('/auth', auth);

router.use('/v1', v1);

module.exports = router;