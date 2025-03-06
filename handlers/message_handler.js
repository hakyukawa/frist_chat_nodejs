const { userInfo } = require('os');
const message_service = require('../services/message_service');

const send_message = async (req, res) => {
    const { channel_id, content } = req.body;
    const response = await message_service.send_message(req.user_id, channel_id, content);
    res.status(response.status).json(response);
};

const edit_message = async (req, res) => {
    const { message_id } = req.params;
    const { content } = req.body;
    const response = await message_service.edit_message(req.user_id, message_id, content);
    res.status(response.status).json(response);
};

const get_message = async (req, res) => {
    const { channel_id } = req.params;
    const user_id = req.user_id;
    const response = await message_service.get_message(channel_id, user_id);
    res.status(response.status).json(response);
};

module.exports = {
    send_message,
    edit_message,
    get_message
};