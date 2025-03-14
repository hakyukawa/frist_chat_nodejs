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
}

module.exports = new item_repository();