const message_service = require('../services/message_service');

const send_message = async (req, res) => {
    const { channel_id, content } = req.body;
    const response = await message_service.send_message(req.user_id, channel_id, content);
    res.status(response.status).json(response);
};

module.exports = {
    send_message
};