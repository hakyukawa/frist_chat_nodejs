const pool = require('../config/database');
const utils = require('../utils/utils');

class item_repository {
    //全てのアイテムを取得
    async get_items() {
        try {
            const [rows] = await pool.query('SELECT * FROM item ORDER BY item_id ASC');
            return rows;
        } catch (error) {
            return error;
        }
    }

    //タイプ別でアイテムを取得
    async get_items_by_type(type) {
        try {
            const [rows] = await pool.query('SELECT * FROM item WHERE item_type = ? ORDER BY item_id ASC', [type]);
            return rows;
        } catch (error) {
            return error;
        }
    }

    //特定のアイテムを取得
    async get_item_by_id(item_id) {
        try {
            const [rows] = await pool.query('SELECT * FROM item WHERE item_id = ?', [item_id]);
            return rows[0];
        } catch (error) {
            return error;
        }
    }

    async buy_item(user_id, item_id, transaction_id, point, transaction_at) {
        try {
            const [rows] = await pool.query('UPDATE user SET point = point - (SELECT item_point FROM item WHERE item_id = ?) WHERE user_id = ?', [item_id, user_id]);
            const [transaction] = await pool.query('INSERT INTO transaction_history (transaction_id, user_id, item_id, used_point, transaction_at) VALUES (?, ?, ?, ?, ?)',[transaction_id, user_id, item_id, point, transaction_at]);
            const [user_item] = await pool.query('INSERT INTO user_item (user_id, item_id, got_at) VALUES (?, ?, ?)',[user_id, item_id, transaction_at]);
            return user_item;
        } catch (error) {
            return error;
        }
    };

    async get_transaction_history(user_id, item_id) {
        try {
            const [rows] = await pool.query('SELECT * FROM transaction_history WHERE user_id = ? AND item_id = ?', [user_id, item_id]);
            return rows[0];
        } catch (error) {
            return error;
        }
    }
}

module.exports = new item_repository();