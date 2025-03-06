// アイテムタイプ
class ItemType {
    constructor(type_id, type_name) {
        this.type_id = type_id;
        this.type_name = type_name;
    }
}

// アイテム
class Item {
    constructor(item_id, item_name, item_type, item_point, description, image_url, created_at) {
        this.item_id = item_id;
        this.item_name = item_name;
        this.item_type = item_type;
        this.item_point = item_point;
        this.description = description;
        this.image_url = image_url;
        this.created_at = created_at;
    }
}

//ユーザー保有アイテム
class UserItem {
    constructor(user_id, item_id, got_at) {
        this.user_id = user_id;
        this.item_id = item_id;
        this.got_at = got_at;
    }
}

module.exports = {
    ItemType,
    Item,
    UserItem,
}