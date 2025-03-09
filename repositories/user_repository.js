const { read } = require('fs');
const pool = require('../config/database');
const User = require('../models/User');
const { item_simple_response } = require('../dtos/item');
const { Item } = require('../models/Item');
const { get_user_twoinfo } = require('../dtos/user');

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
    // サインアップ関数
    async resister(id, username, mail, hashedPassword, rank, point, created_time) {
        try {
            const [rows] = await pool.query('INSERT INTO user (user_id, user_name, mail, password, user_rank, point, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, username, mail, hashedPassword, rank, point, created_time]);
            return rows.insertId;
        } catch (error) {
            throw error;
        }
    }
    // プロフィール取得
    async get_user_profile(user_id) {
        try {
            const [ rows ] = await pool.query('SELECT user_id, user_name, icon_url, user_rank, point FROM user WHERE user_id = ?', [user_id]);

            if (rows.length === 0) {
                return null; // ユーザーが見つからない場合
            }
            // データベースの行を User モデルのインスタンスに変換
            const userProfile = rows[0];
            return new User (
                userProfile.user_id,
                userProfile.user_name,
                userProfile.mail,
                userProfile.password,
                userProfile.icon_url,
                userProfile.user_rank,
                userProfile.point,
                userProfile.created_at
            );
        } catch (error) {
            throw error;
        }
    }
    // チャンネル追加関数
    async add_channel(channel_id, server_id, channel_name, created_time) {
        try {
            await pool.query('INSERT INTO channel (channel_id, server_id, channel_name, created_at) VALUES (?, ?, ?, ?)', [channel_id, server_id, channel_name, created_time]);

            return {channel_id, channel_name};
        } catch (error) {
            throw error;
        }
    }

    async get_user_items(user_id) {
        try {
            const [ rows ] = await pool.query('SELECT i.item_id, i.item_name, i.image_url FROM user_item as ui JOIN item as i ON ui.item_id = i.item_id WHERE ui.user_id = ?', [user_id]);
            if (rows.length === 0) {
                return null; // アイテムが見つからない場合
            }
            //データベースの行を Item モデルのインスタンスに変換
            return rows.map(itemData => new item_simple_response(
                itemData.item_id,
                itemData.item_name,
                itemData.image_url,
            ));
        } catch (error) {
            throw error;
        }
    }

    async update_user_profile(user_id, user_name, icon_url) {
        const [updateProfile] = await pool.query('UPDATE user SET user_name = ?, icon_url = ? WHERE user_id = ?', [user_name, icon_url, user_id]);

        return updateProfile.affectedRows;
    }

    async get_user_info (user_id) {
        try {
            const [ rows ] = await  pool.query('SELECT user_id, user_name, icon_url FROM user WHERE user_id = ?', [user_id]);

            if (!rows.length === 0) {
                return null; // ユーザー情報見つからない
            }
            const userData = rows[0];
            return new get_user_twoinfo (
                userData.user_id,
                userData.user_name,
                userData.icon_url,
            );
        } catch (error) {
            return error;
        }
    }
}

module.exports = new user_repository();