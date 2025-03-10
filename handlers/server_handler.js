const server_service = require('../services/server_service');

const create_server = async (req, res) => {
    const { server_name, icon_url, until_reply, start_at, end_at, weeks, start_core_time, end_core_time } = req.body;
    const owner_id = req.user_id;

    const result = await server_service.create_server(owner_id, server_name, icon_url, until_reply, start_at, end_at, weeks, start_core_time, end_core_time);
    res.status(result.status).json(result);
}

const get_server_list = async (req, res) => {
    const result = await server_service.get_server_list(req.user_id);
    res.status(result.status).json(result);
}

const get_channel_list = async (req, res) => {
    const result = await server_service.get_channel_list(req.params.server_id);
    res.status(result.status).json(result);
}

const get_server = async (req, res) => {
    const user_id = req.user_id;
    const server_id  = req.params.server_id;
    const result = await server_service.get_server(server_id, user_id);

    res.status(result.status).json(result,);
}

const update_server = async (req, res) => {
    const server_id = req.params.server_id;
    const { server_name, icon_url, until_reply, start_at, end_at, weeks, start_core_time, end_core_time } = req.body;
    const result = await server_service.update_server(server_id, server_name, icon_url, until_reply, start_at, end_at, weeks, start_core_time, end_core_time);

    res.status(result.status).json(result);
}

const get_server_members = async (req, res) => {
    const server_id = req.params.server_id;
    const result = await server_service.get_server_members(server_id);

    res.status(result.status).json(result);
}

const get_non_server_members = async (req, res) => {
    const user_id = req.user_id;
    const server_id = req.params.server_id;

    const result = await server_service.get_non_server_members(user_id, server_id);

    res.status(result.status).json(result);
}

const get_server_unread_count = async (req, res) => {
    const user_id = req.user_id;
    const server_id = req.params.server_id;

    const result = await server_service.get_server_unread_count(server_id, user_id);

    res.status(result.status).json(result);
}

const delete_channel = async (req, res) => {
    const channel_id = req.params.channel_id;
    const result = await server_service.delete_channel(channel_id);

    res.status(result.status).json(result);
}

module.exports = {
    create_server,
    get_server,
    update_server,
    get_server_list,
    get_channel_list,
    get_server_members,
    get_non_server_members,
    get_server_unread_count,
    delete_channel
}