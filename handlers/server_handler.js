const server_service = require('../services/server_service');

const create_server = async (req, res) => {
    const { server_name, until_reply, start_at, end_at, weeks, start_core_time, end_core_time } = req.body;
    const owner_id = req.user_id;

    const result = await server_service.create_server(owner_id, server_name, until_reply, start_at, end_at, weeks, start_core_time, end_core_time);
    res.status(result.status).json(result);

}

const get_server_list = async (req, res) => {
    const result = await server_service.get_server_list(req.user_id);
    res.status(result.status).json(result);
}

module.exports = {
    create_server,
    get_server_list
}