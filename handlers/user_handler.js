const { access } = require('fs');
const auth = require('../middleware/auth');
const user_service = require('../services/user_service');
const { console } = require('inspector');
const { error } = require('console');
const utils = require('../utils/utils');

const login = async (req, res, next) => {
    const { user_id, password } = req.body;
    const result = await user_service.login(user_id, password);

    res.status(result.status).json({
        message: result.message,
        access_token: result.access_token || null,
        refresh_token: result.refresh_token || null,
        user_id: result.user_id || null,
        error: result.error || null,
    });
}

const signup = async (req, res) => {
    const { user_id, user_name, mail, password } = req.body;
    console.log(user_name);
    const result = await user_service.signup(user_id, user_name, mail, password);

    res.status(result.status).json({
        message: result.message,
        error: result.error || null,
    });
}

const createChannel = async (req, res) => {
    const { server_id, channel_name } = req.body;
    const channel_id = utils.generateUUID();
    const result = await user_service.createChannel(channel_id, server_id, channel_name);

    res.status(result.status).json({
        message: result.message,
        channel_id: result.channel_id,
        channel_name: result.channel_name,
        error: result.error || null,
    });
}

const get_profile = async (req, res) => {
    const user_id = req.user_id;
    if (!user_id) {
        // return { status: 404, message: 'ユーザーIDがありません' };
        return res.status(404).json({message: 'ユーザーIDがありません'});
    }
    const result = await user_service.get_profile(user_id);

    if (!result) {
        return res.status(404).json({ status: 404, message: 'ユーザープロフィールが見つかりません' });
    }

    res.status(result.status).json({
        status: result.status,
        message: result.message,
        user_id: result.user_id || null,
        user_name: result.user_name || null,
        icon_url: result.icon_url || null,
        user_rank: result.user_rank || 0,
        user_point: result.user_point || 0,
        error: result.error || null,
    });
}

module.exports = {
    login,
    signup,
    get_profile,
    createChannel,
}