const { access } = require('fs');
const auth = require('../middleware/auth');
const user_service = require('../services/user_service');
const { console } = require('inspector');

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
    const {user_id, user_name, mail, password} = req.body;
    console.log(user_name);
    const result = await user_service.signup(user_id, user_name, mail, password);

    res.status(result.status).json({
        message: result.message,
    });
}

module.exports = {
    login,
    signup
}