const pool = require('../config/database');
const User = require('../models/User');

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
                userData.user_id,
                userData.user_name,
                userData.mail,
                userData.password,
                userData.icon_url,
                userData.user_rank,
                userData.point,
                userData.created_at
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
    // サインアップ関数
    async resister(id, username, mail, hashedPassword, rank, point, created_time) {
        try {
            const [rows] = await pool.query('INSERT INTO user (user_id, user_name, mail, password, user_rank, point, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, username, mail, hashedPassword, rank, point, created_time]);
            return rows.insertId;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new user_repository();