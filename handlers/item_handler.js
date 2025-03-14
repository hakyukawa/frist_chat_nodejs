const item_service = require("../services/item_service");

const get_items = async (req, res) => {
    const items = await item_service.get_items();
    res.status(items.status).json(items);
};

const get_items_by_type = async (req, res) => {
    const item_type = req.params.item_type;
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(item_type)) {
        get_item_by_id(req, res);
        return;
    }
    const items = await item_service.get_items_by_type(item_type);
    res.status(items.status).json(items);
};

const get_item_by_id = async (req, res) => {
    const item_id = req.params.item_type;
    const item = await item_service.get_item_by_id(item_id);
    res.status(item.status).json(item);
};

const buy_item = async (req, res) => {
    const user_id = req.user_id;
    const item_id = req.body.item_id;
    const result = await item_service.buy_item(user_id, item_id);
    res.status(result.status).json(result);
};

module.exports = {
    get_items,
    get_items_by_type,
    get_item_by_id,
    buy_item
};