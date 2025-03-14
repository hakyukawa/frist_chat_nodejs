item_repository = require('../repositories/item_repository');

class item_service {

    //全てのアイテムを取得
    async get_items() {
        try {
            const items = await item_repository.get_items();
            return {
                status: 200,
                message: 'アイテム一覧取得成功',
                items: items
            }
        } catch (error) {
            return {
                status: 500,
                message: 'アイテム一覧取得失敗',
                error: error
            }
        }
    };

    //タイプ別でアイテムを取得
    async get_items_by_type(type) {
        try {
            if (!type) {
                return {
                    status: 404,
                    message: 'アイテムタイプがありません'
                }
            }
            const items = await item_repository.get_items_by_type(type);
            if(!items || items.length === 0) {
                return {
                    status: 404,
                    message: 'アイテムが見つかりません'
                }
            }
            return {
                status: 200,
                message: 'アイテム一覧取得成功(type別)',
                items: items
            }
        } catch (error) {
            return {
                status: 500,
                message: 'アイテム一覧取得失敗',
                error: error
            }
        }
    };

    //特定のアイテムを取得
    async get_item_by_id(item_id) {
        try {
            if (!item_id) {
                return {
                    status: 404,
                    message: 'アイテムがありません'
                }
            }
            const item = await item_repository.get_item_by_id(item_id);
            if(!item) {
                return {
                    status: 404,
                    message: 'アイテムが見つかりません'
                }
            }
            return {
                status: 200,
                message: 'アイテム取得成功(個別)',
                item: item
            }
        } catch (error) {
            return {
                status: 500,
                message: 'アイテム取得失敗',
                error: error
            }
        }
    };
}

module.exports = new item_service;