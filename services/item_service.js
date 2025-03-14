const user_repository = require('../repositories/user_repository');
const utils = require('../utils/utils');
const item_repository = require('../repositories/item_repository'); 

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

    async buy_item(user_id, item_id) {
        try {
            const item = await item_repository.get_item_by_id(item_id);
            console.log(item);
            if(!item) {
                return {
                    status: 404,
                    message: 'アイテムが見つかりません'
                }
            }
            const user = await user_repository.get_user_byID(user_id);
            if(!user) {
                return {
                    status: 404,
                    message: 'ユーザーが見つかりません'
                }
            }
            const transaction_history = await item_repository.get_transaction_history(user_id, item_id);
            if(transaction_history) {
                return {
                    status: 400,
                    message: 'アイテムは一度しか購入できません'
                }
            }
            console.log(`user.point: ${user.point}, item.item_point: ${item.ITEM_POINT}`);
            if(user.point < item.ITEM_POINT) {
                return {
                    status: 400,
                    message: 'ユーザーのポイントが不足しています'
                }
            }
            const transaction_id = utils.generateUUID();
            await item_repository.buy_item(user_id, item_id, transaction_id, item.ITEM_POINT, utils.getCurrentDateTime());
            return {
                status: 200,
                message: 'アイテム購入成功',
                item: item,
                transaction_id: transaction_id
            }
        } catch (error) {
            console.log(error);
            return {
                status: 500,
                message: 'アイテム購入失敗',
                error: error
            }
        }
    };
}

module.exports = new item_service;