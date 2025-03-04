require('dotenv').config();

const config = {
  server: {
    port: process.env.NODE_PORT || 3001,
    timezone: process.env.TZ || 'Asia/Tokyo'
  },
  
  database: {
    host: process.env.MYSQL_HOSTNAME || 'localhost',
    port: process.env.MYSQL_PORT || 3300,
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DATABASE
  },
  
  jwt: {
    secret: process.env.JWT_SECRET_KEY,
    refresh_secret: process.env.JWT_REFRESH_SECRET_KEY || process.env.JWT_SECRET_KEY,
    access_token_expiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '1h',   // デフォルト：1時間
    refresh_token_expiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d'  // デフォルト：7日間
  },
  
  // その他の設定
  cors: {
    allowed_origins: (process.env.CORS_ALLOWED_ORIGINS || '*').split(','),
    allowed_methods: (process.env.CORS_ALLOWED_METHODS || 'GET,POST,PUT,DELETE,PATCH').split(',')
  }
};

module.exports = config;