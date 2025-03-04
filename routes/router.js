const express = require('express');
const router = express.Router();
const middleware_auth = require('../middleware/auth');
const user_handler = require('../handlers/user_handler');
const validate_body = require('../middleware/validate_body');

const v1 = express.Router();

v1.post('/login',validate_body, user_handler.login);
//v1.post('/register', user_handler.registerhandler);

// 認証後のエンドポイント
const auth = express.Router();
auth.use(middleware_auth.verify_token);

// ユーザー関連のエンドポイント
const user = express.Router();

user.get('/profile',);

//　エンドポイントをマウント
auth.use('/user', user);
v1.use('/auth', auth);

router.use('/v1', v1);

module.exports = router;