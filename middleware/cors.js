// middleware/cors.js
const config = require('../config/config');

const cors = (app) => {
    app.use((req, res, next) => {
        try {
            const origin = req.headers.origin;

            // 許可するオリジンを設定
            if (!config.cors || !config.cors.allowed_origins) {
                console.error('CORS configuration is missing or invalid');
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            if (config.cors.allowed_origins.includes('*') || (origin && config.cors.allowed_origins.includes(origin))) {
                res.setHeader('Access-Control-Allow-Origin', origin || '*');
            } else {
                // 許可されていないオリジンの場合
                return res.status(403).json({ error: 'Origin not allowed' });
            }

            // その他のCORS関連ヘッダー設定
            res.setHeader('Access-Control-Allow-Methods', config.cors.allowed_methods.join(','));
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.setHeader('Access-Control-Allow-Credentials', 'true');

            // プリフライトリクエスト（OPTIONS）の処理
            if (req.method === 'OPTIONS') {
                return res.status(200).end();
            }

            next();
        } catch (error) {
            console.error('CORS error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
};

module.exports = cors;