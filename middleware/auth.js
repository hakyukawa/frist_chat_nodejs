const jwt = require('jsonwebtoken');
const config = require('../config/config');

// JWTの検証
const verify_token = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            const error = new Error('認証トークンが見つかりません');
            error.statusCode = 401;
            return next(error);
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwt.secret);

        req.userId = decoded.userId;
        req.tokenData = decoded;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            error.message = '認証トークンの有効期限が切れました';
            error.statusCode = 401;
        } else if (error.name === 'JsonWebTokenError') {
            error.message = '無効な認証トークンです';
            error.statusCode = 401;
        } else {
            error.statusCode = 500;
            error.message = '認証トークンの検証中にエラーが発生しました';
        }

        next(error);
    }
};

// リフレッシュトークンの検証
const verify_refresh_token = (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            const error = new Error('リフレッシュトークンが見つかりません');
            error.statusCode = 401;
            return next(error);
        }

        const decoded = jwt.verify(refreshToken, config.jwt.refresh_secret);
        req.refreshToken = decoded;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            error.message = 'リフレッシュトークンの有効期限が切れました';
            error.statusCode = 401;
        } else if (error.name === 'JsonWebTokenError') {
            error.message = '無効なリフレッシュトークンです';
            error.statusCode = 401;
        } else {
            error.statusCode = 500;
            error.message = 'リフレッシュトークンの検証中にエラーが発生しました';
        }

        next(error);
    }
};

// アクセストークンの生成
const generate_access_token = (userId) => {
    const token = jwt.sign({ userId }, config.jwt.secret, {
        expiresIn: '1h',
    });
    return token;
};

// リフレッシュトークンの生成
const generate_refresh_token = (payload) => {
    return token = jwt.sign(payload, config.jwt.refresh_secret, { expiresIn: config.jwt.refresh_token_expiry });
};

module.exports = {
    verify_token,
    verify_refresh_token,
    generate_access_token,
    generate_refresh_token
};