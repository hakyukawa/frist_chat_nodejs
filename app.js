const express = require('express');
const { createServer } = require('http');
const web_socket = require('ws');
const config = require('./config/config');
const setup_cors = require('./middleware/cors');
const routes = require('./routes/router');
const db = require('./db');
const setup_web_socket = require('./routes/websocket_router');

db.initializeDatabase();

const app = express();
const server = createServer(app);

// ミドルウェア設定
app.use(express.json());
setup_cors(app);

// ルーター
app.use('/api',routes);

const {wss, clients, user_info} = setup_web_socket(server);

// 存在しないページへのアクセスで404を返す
app.use((req, res, next) => {
    res.status(404).json({
        status: 404,
        message: 'ページが見つかりません',
    });
});

// サーバー起動
server.listen(config.server.port, () => {
  console.log(`サーバーが起動しました: http://localhost:${config.server.port}`);
});

module.exports = {app, server};