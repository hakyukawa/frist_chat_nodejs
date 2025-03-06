const server_service = require('../services/server_service');

const create_server = async (req, res) => {
    const { server_name, until_reply, start_at, end_at, weeks, start_core_time, end_core_time } = req.body;
    const owner_id = req.user_id;

    const result = await server_service.create_server(owner_id, server_name, until_reply, start_at, end_at, weeks, start_core_time, end_core_time);
    res.status(result.status).json(result);

}

const get_server = async (req, res) => {
    const server_id  = req.params.id;
    if (!server_id) {
        return res.status(400).json('サーバーIDがありません');
    }

    const result = await server_service.get_server(server_id);

    res.status(result.status).json(result);
}

module.exports = {
    create_server,
    get_server,
}