const express = require('express');
const { createServer } = require('http');
const web_socket = require('ws');
const config = require('./config/config');
const setup_cors = require('./middleware/cors');
const routes = require('./routes/router');
const db = require('./db');

db.initializeDatabase();

const app = express();
const server = createServer(app);
const wss = new web_socket.Server({ server });

// ミドルウェア設定
app.use(express.json());
setup_cors(app);

// ルーター
app.use('/api',routes);

// 存在しないページへのアクセスで404を返す
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'ページが見つかりません',
    });
});

// サーバー起動
app.listen(config.server.port, () => {
  console.log(`サーバーが起動しました: http://localhost:${config.server.port}`);
});

module.exports = {app, server};