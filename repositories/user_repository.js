const pool = require('../config/database');
const User = require('../models/User');
const { use } = require('../routes/router');

class user_repository {
    async get_user_byID(id) {
        try {
            const [rows] = await pool.query('SELECT * FROM user WHERE user_id = ?', [id]);

            if (rows.length === 0) {
                return null; // ユーザーが見つからない場合
            }

            // データベースの行を User モデルのインスタンスに変換
            const userData = rows[0];
            return new User(
                userData.USER_ID,
                userData.USER_NAME,
                userData.MAIL,
                userData.PASSWORD,
                userData.ICON_URL,
                userData.USER_RANK,
                userData.POINT,
                userData.CREATED_AT
            );
        } catch (error) {
            throw error;
        }
    }

    async get_user_password(id) {
        try {
            const [rows] = await pool.query('SELECT password FROM user WHERE user_id = ?', [id]);
            if (rows.length === 0) {
                return null; // ユーザーが見つからない場合
            }
            return rows[0].password;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new user_repository();