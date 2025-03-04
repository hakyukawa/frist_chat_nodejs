const jwt = require('jsonwebtoken');
const config = require('../config/config');

// JWTの検証
const verify_token = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: '認証トークンが見つかりません' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwt.secret);

        if (!decoded.user_id) {
            return res.status(401).json({ success: false, message: '認証トークンの検証中にエラーが発生しました' });
        }

        req.user_id = decoded.user_id;
        req.token_data = decoded;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: '認証トークンの有効期限が切れました' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: '無効な認証トークンです' });
        } else {
            return res.status(500).json({ success: false, message: '認証トークンの検証中にエラーが発生しました' });
        }
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
const generate_access_token = (user_id) => {
    const token = jwt.sign({ user_id: user_id }, config.jwt.secret, {
        expiresIn: '1h',
    });
    return token;
};

// リフレッシュトークンの生成
const generate_refresh_token = (payload) => {
    return jwt.sign(payload, config.jwt.refresh_secret, { expiresIn: config.jwt.refresh_token_expiry });
};

module.exports = {
    verify_token,
    verify_refresh_token,
    generate_access_token,
    generate_refresh_token
};