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

            const item_url = await this.get_item_url(rows[0].ITEM_ID);

            // データベースの行を User モデルのインスタンスに変換
            const userData = rows[0];
            return new User(
                userData.USER_ID,
                userData.USER_NAME,
                userData.MAIL,
                userData.PASSWORD,
                userData.ICON_URL,
                item_url,
                userData.USER_RANK,
                userData.EXP,
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
            const [rows] = await pool.query('INSERT INTO user (user_id, user_name, mail, password, user_rank, exp, point, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, username, mail, hashedPassword, rank, exp, point, created_time]);
            return rows.insertId;
        } catch (error) {
            throw error;
        }
    }
    // プロフィール取得
    async get_user_profile(user_id) {
        try {
            const [ rows ] = await pool.query('SELECT user_id, user_name, icon_url, item_id, user_rank, exp, point FROM user WHERE user_id = ?', [user_id]);

            if (rows.length === 0) {
                return null; // ユーザーが見つからない場合
            }

            const item_url = await this.get_item_url(rows[0].item_id);
            // データベースの行を User モデルのインスタンスに変換
            const userProfile = rows[0];
            return new User (
                userProfile.user_id,
                userProfile.user_name,
                userProfile.mail,
                userProfile.password,
                userProfile.icon_url,
                item_url,
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
            console.error("insert_server_user Error:", error);
            return null;
        }
    }

    // リードステータスにユーザー追加
    async insert_readstatus(user_id, channel_id, last_read_message_id, last_message_id, unread_count, last_viewed_at, last_updated_id) {
        try {
            const query = `
                INSERT INTO read_status
                (
                    channel_id, user_id, 
                    last_read_message_id, 
                    last_message_id, unread_count, 
                    last_viewed_at, last_updated_at
                ) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            const [ rows ] = await pool.query(query, [channel_id, user_id, last_read_message_id, last_message_id, unread_count, last_viewed_at, last_updated_id]);

            if (rows.affectedRows === 0) {
                return null;
            }
            return rows.affectedRows;
        } catch (error) {
            console.error("insert_server_user Error:", error);
            return null;
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
            const [ rows ] = await  pool.query('SELECT user_id, user_name, icon_url, item_id FROM user WHERE user_id = ?', [user_id]);

            if (!rows.length === 0) {
                return null; // ユーザー情報見つからない
            }
            const userData = rows[0];
            const item_url = await this.get_item_url(userData.item_id);
            return new get_user_twoinfo (
                userData.user_id,
                userData.user_name,
                userData.icon_url,
                item_url
            );
        } catch (error) {
            return error;
        }
    }

    async get_item_url(item_id) {
        try {
            const [ rows ] = await pool.query('SELECT image_url FROM item WHERE item_id = ?', [item_id]);
            if (rows.length === 0) {
                return null; // アイテムが見つからない場合
            }
            return rows[0].image_url;
        } catch (error) {
            throw error;
        }
    }

    async save_points(user_id, points) {
        try {
            // ポイントとEXPを同時に加算（両方に同じ値を加算）
            const query = 'UPDATE user SET POINT = POINT + ?, EXP = EXP + ? WHERE USER_ID = ?';
            const result = await pool.query(query, [points, points, user_id]);
            
            if (result.affectedRows === 0) {
                throw new Error('ユーザーが見つかりません');
            }
            
            return true;
        } catch (error) {
            console.error('ポイント更新エラー:', error);
            throw error;
        }
    }

    //ポイント加算履歴を追加
    async save_point_award(award_id, user_id, channel_id, points, awarded_at) {
        try {
            console.log("セーブします");
            const query = 'INSERT INTO point_award (AWARD_ID, USER_ID, CHANNEL_ID, POINT, AWARDED_AT) VALUES (?, ?, ?, ?, ?)';
            const [result] = await pool.query(query, [award_id, user_id, channel_id, points, awarded_at]);
            return true;
        } catch (error) {
            return error;
        }
    }

    async get_last_point_award(user_id, channel_id) {
        try {
            const query = `
                SELECT *
                FROM point_award
                WHERE USER_ID = ? AND CHANNEL_ID = ?
                ORDER BY AWARDED_AT DESC
                LIMIT 1
            `;
    
            const [rows] = await pool.query(query, [user_id, channel_id]);
            return rows;
        } catch (error) {
            console.error("Error in get_last_point_award:", error);
            throw error;
        }
    }
}

module.exports = new user_repository();